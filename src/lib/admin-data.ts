// 관리자 페이지용 회원 데이터 조회 — 서버 전용(service_role).
// 호출하는 쪽(페이지)이 관리자 여부를 먼저 확인해야 한다.
import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ENTITLEMENT_PRODUCTS,
  entitlementEnd,
  entitlementProductIds,
  isEntitlementActive,
  slugIds,
  type EntitlementAlias,
} from '@/lib/entitlements';

export type OrderRow = {
  id: string;
  order_id: string;
  user_id: string | null;
  product_slug: string | null;
  order_name: string | null;
  amount: number | null;
  status: string | null;
  created_at: string;
};

export type GrantRow = {
  id: string;
  user_id: string;
  product: string;
  note: string | null;
  granted_at: string;
  revoked_at: string | null;
};

export type AccessRow = {
  user_id: string;
  device_id: string;
  bound_at: string | null;
};

// 'paid' = 결제로 보유, 'granted' = 관리자 지급으로 보유. 빈 배열이면 이용권 없음.
export type EntitlementSource = 'paid' | 'granted';

export type MemberSummary = {
  id: string;
  email: string;
  name: string;
  providers: string[];
  createdAt: string;
  lastSignInAt: string | null;
  entitlements: Record<EntitlementAlias, EntitlementSource[]>;
  // 기간이 있는 이용권(CBT)의 가장 늦게 끝나는 날(ISO). 이미 끝났어도 남긴다. 기간 검사가 없거나 없으면 null.
  expiresAt: Record<EntitlementAlias, string | null>;
  paidTotal: number;
  orderCount: number;
  waitingDeposit: number;
  cbtDeviceBound: boolean;
};

export type MemberDetail = {
  member: MemberSummary;
  orders: OrderRow[];
  grants: GrantRow[];
  access: AccessRow | null;
  grantsTableReady: boolean;
};

function memberName(user: User): string {
  const meta = user.user_metadata ?? {};
  return String(meta.name || meta.full_name || meta.nickname || user.email?.split('@')[0] || '회원');
}

function memberProviders(user: User): string[] {
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers) && providers.length > 0) return providers.map(String);
  return user.app_metadata?.provider ? [String(user.app_metadata.provider)] : [];
}

export function summarizeMember(
  user: User,
  orders: OrderRow[],
  grants: GrantRow[],
  access: AccessRow | undefined | null,
  productIds: Record<EntitlementAlias, string[]>,
): MemberSummary {
  const done = orders.filter((o) => o.status === 'DONE');

  const entitlements = {} as Record<EntitlementAlias, EntitlementSource[]>;
  const expiresAt = {} as Record<EntitlementAlias, string | null>;
  for (const { alias } of ENTITLEMENT_PRODUCTS) {
    const paidStarts = done
      .filter((o) => slugIds(o.product_slug).some((id) => productIds[alias].includes(id)))
      .map((o) => o.created_at);
    const grantStarts = grants
      .filter((g) => g.product === alias && !g.revoked_at)
      .map((g) => g.granted_at);

    // 기간이 끝난 결제·지급은 보유로 세지 않는다
    const sources: EntitlementSource[] = [];
    if (paidStarts.some((t) => isEntitlementActive(alias, t))) sources.push('paid');
    if (grantStarts.some((t) => isEntitlementActive(alias, t))) sources.push('granted');
    entitlements[alias] = sources;

    const ends = [...paidStarts, ...grantStarts]
      .map((t) => entitlementEnd(alias, t))
      .filter((d): d is Date => d !== null);
    expiresAt[alias] = ends.length
      ? new Date(Math.max(...ends.map((d) => d.getTime()))).toISOString()
      : null;
  }

  return {
    id: user.id,
    email: user.email ?? '',
    name: memberName(user),
    providers: memberProviders(user),
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    entitlements,
    expiresAt,
    paidTotal: done.reduce((sum, o) => sum + (o.amount ?? 0), 0),
    orderCount: orders.length,
    waitingDeposit: orders.filter((o) => o.status === 'WAITING_FOR_DEPOSIT').length,
    cbtDeviceBound: Boolean(access),
  };
}

function groupByUser<T extends { user_id: string | null }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    if (!row.user_id) continue;
    const list = map.get(row.user_id);
    if (list) list.push(row);
    else map.set(row.user_id, [row]);
  }
  return map;
}

// service_role 키가 없으면(로컬 등) null.
export async function listMembers(): Promise<{
  members: MemberSummary[];
  grantsTableReady: boolean;
} | null> {
  const db = createAdminClient();
  if (!db) return null;

  const users: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`회원 목록 조회 실패: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const [orders, grants, access, productIds] = await Promise.all([
    // 결제창만 열고 나간 주문(READY)은 빼고 본다.
    db.from('orders').select('*').neq('status', 'READY').order('created_at', { ascending: false }),
    db.from('entitlement_grants').select('*'),
    db.from('cbt_access').select('*'),
    entitlementProductIds(),
  ]);
  if (orders.error) throw new Error(`주문 조회 실패: ${orders.error.message}`);

  const ordersByUser = groupByUser((orders.data ?? []) as OrderRow[]);
  const grantsByUser = groupByUser((grants.error ? [] : grants.data ?? []) as GrantRow[]);
  const accessByUser = new Map(
    ((access.data ?? []) as AccessRow[]).map((row) => [row.user_id, row]),
  );

  const members = users
    .map((user) =>
      summarizeMember(
        user,
        ordersByUser.get(user.id) ?? [],
        grantsByUser.get(user.id) ?? [],
        accessByUser.get(user.id),
        productIds,
      ),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { members, grantsTableReady: !grants.error };
}

// service_role 키가 없으면 'unavailable', 회원이 없으면 null.
export async function getMemberDetail(userId: string): Promise<MemberDetail | null | 'unavailable'> {
  const db = createAdminClient();
  if (!db) return 'unavailable';

  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data.user) return null;

  const [orders, grants, access, productIds] = await Promise.all([
    db
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'READY')
      .order('created_at', { ascending: false }),
    db
      .from('entitlement_grants')
      .select('*')
      .eq('user_id', userId)
      .order('granted_at', { ascending: false }),
    db.from('cbt_access').select('*').eq('user_id', userId).maybeSingle(),
    entitlementProductIds(),
  ]);
  if (orders.error) throw new Error(`주문 조회 실패: ${orders.error.message}`);

  const orderRows = (orders.data ?? []) as OrderRow[];
  const grantRows = (grants.error ? [] : grants.data ?? []) as GrantRow[];
  const accessRow = (access.data ?? null) as AccessRow | null;

  return {
    member: summarizeMember(data.user, orderRows, grantRows, accessRow, productIds),
    orders: orderRows,
    grants: grantRows,
    access: accessRow,
    grantsTableReady: !grants.error,
  };
}
