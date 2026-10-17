// 관리자 페이지용 회원 데이터 조회 — 서버 전용(service_role).
// 호출하는 쪽(페이지)이 관리자 여부를 먼저 확인해야 한다.
import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ENTITLEMENT_PRODUCTS,
  entitlementPlans,
  grantEnd,
  orderEnd,
  slugIds,
  type EntitlementAlias,
  type EntitlementPlans,
} from '@/lib/entitlements';
import { ADMIN_TEST_ORDER_PREFIX } from '@/lib/test-order';
import { isAdminAccount } from '@/lib/admin';

export type OrderRow = {
  id: string;
  order_id: string;
  user_id: string | null;
  product_slug: string | null;
  order_name: string | null;
  amount: number | null;
  status: string | null;
  created_at: string;
  phone?: string | null; // 모의 CBT 결제 때 받은 휴대폰 번호
  marketing_agreed_at?: string | null; // [선택] 새 소식 문자 동의 시각
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
  moved_at?: string | null; // 회원이 [이 기기로 옮기기]로 직접 옮긴 때(2026-10-15 칸 추가)
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
  // 이용권의 가장 늦게 끝나는 날(ISO). 이미 끝났어도 남긴다. 결제·지급이 없으면 null.
  expiresAt: Record<EntitlementAlias, string | null>;
  paidTotal: number;
  orderCount: number;
  waitingDeposit: number;
  cbtDeviceBound: boolean;
  // 가장 최근 결제에 남긴 휴대폰 번호와, 그 결제 때 새 소식 문자에 동의했는지
  phone: string | null;
  smsNews: boolean;
  isAdmin: boolean; // 관리자 계정 — 결제 요약·'결제 회원' 필터에서 뺀다
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
  plans: EntitlementPlans,
): MemberSummary {
  const done = orders.filter((o) => o.status === 'DONE');
  const withPhone = done
    .filter((o) => o.phone)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  const entitlements = {} as Record<EntitlementAlias, EntitlementSource[]>;
  const expiresAt = {} as Record<EntitlementAlias, string | null>;
  for (const { alias } of ENTITLEMENT_PRODUCTS) {
    const now = Date.now();
    const paidEnds = done
      .map((o) => orderEnd(plans[alias], o.product_slug, o.created_at))
      .filter((d): d is Date => d !== null);
    const grantEnds = grants
      .filter((g) => g.product === alias && !g.revoked_at)
      .map((g) => grantEnd(alias, g.granted_at));

    // 기간이 끝난 결제·지급은 보유로 세지 않는다
    const sources: EntitlementSource[] = [];
    if (paidEnds.some((d) => d.getTime() > now)) sources.push('paid');
    if (grantEnds.some((d) => d.getTime() > now)) sources.push('granted');
    entitlements[alias] = sources;

    const ends = [...paidEnds, ...grantEnds];
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
    phone: withPhone?.phone ?? null,
    smsNews: Boolean(withPhone?.marketing_agreed_at),
    isAdmin: isAdminAccount(user),
  };
}

// ── 결제 요약 ───────────────────────────────────────────────
// 실제로 돈이 들어온 주문만 센다: 결제완료(DONE) · 금액 > 0 · 관리자 테스트 주문 아님 · 관리자 계정 결제 아님.
// 관리자 지급(entitlement_grants)은 주문이 아니라서 여기에 들어오지 않는다.
export type RevenueRow = {
  key: string;
  label: string;
  orders: number; // 결제 건수
  buyers: number; // 결제한 회원 수(중복 없이)
  amount: number; // 결제 금액 합계(원)
};

export type RevenueSummary = {
  rows: RevenueRow[]; // 이용권별(+ 그 밖의 상품)
  total: RevenueRow;
  canceled: { orders: number; amount: number }; // 취소·환불(합계에서 뺌)
  waiting: { orders: number; amount: number }; // 입금대기(아직 합계에 안 들어감)
  admin: { orders: number; amount: number }; // 관리자 계정이 결제한 것(합계에서 뺌)
};

function isTestOrder(o: OrderRow): boolean {
  return (o.order_name ?? '').startsWith(ADMIN_TEST_ORDER_PREFIX);
}

function isRealMoney(o: OrderRow): boolean {
  return (o.amount ?? 0) > 0 && !isTestOrder(o);
}

export function summarizeRevenue(
  allOrders: OrderRow[],
  plans: EntitlementPlans,
  adminUserIds: Set<string> = new Set(),
): RevenueSummary {
  const byAdmin = (o: OrderRow) => Boolean(o.user_id && adminUserIds.has(o.user_id));
  const adminPaid = allOrders.filter((o) => o.status === 'DONE' && isRealMoney(o) && byAdmin(o));
  const orders = allOrders.filter((o) => !byAdmin(o));

  type Acc = { label: string; orders: number; amount: number; users: Set<string> };
  const acc = new Map<string, Acc>();
  // 이용권은 결제가 없어도 0원으로 보이게 먼저 자리를 만든다.
  for (const { alias, label } of ENTITLEMENT_PRODUCTS) {
    acc.set(alias, { label: `${label} 이용권`, orders: 0, amount: 0, users: new Set() });
  }

  const allUsers = new Set<string>();
  let totalOrders = 0;
  let totalAmount = 0;

  for (const o of orders) {
    if (o.status !== 'DONE' || !isRealMoney(o)) continue;
    const ids = slugIds(o.product_slug);
    const matched = ENTITLEMENT_PRODUCTS.filter(({ alias }) =>
      ids.some((id) => id in plans[alias]),
    );
    let key: string;
    let label: string;
    if (matched.length === 1) {
      key = matched[0].alias;
      label = `${matched[0].label} 이용권`;
    } else if (matched.length > 1) {
      key = 'bundle';
      label = '여러 이용권 함께 결제';
    } else {
      label = o.order_name?.trim() || '그 밖의 상품';
      key = `other:${label}`;
    }
    const row = acc.get(key) ?? { label, orders: 0, amount: 0, users: new Set<string>() };
    row.orders += 1;
    row.amount += o.amount ?? 0;
    if (o.user_id) row.users.add(o.user_id);
    acc.set(key, row);

    totalOrders += 1;
    totalAmount += o.amount ?? 0;
    if (o.user_id) allUsers.add(o.user_id);
  }

  const rows: RevenueRow[] = [...acc.entries()].map(([key, r]) => ({
    key,
    label: r.label,
    orders: r.orders,
    buyers: r.users.size,
    amount: r.amount,
  }));

  const sumOf = (status: string) => {
    const list = orders.filter((o) => o.status === status && isRealMoney(o));
    return { orders: list.length, amount: list.reduce((sum, o) => sum + (o.amount ?? 0), 0) };
  };

  return {
    rows,
    total: { key: 'total', label: '합계', orders: totalOrders, buyers: allUsers.size, amount: totalAmount },
    canceled: sumOf('CANCELED'),
    waiting: sumOf('WAITING_FOR_DEPOSIT'),
    admin: {
      orders: adminPaid.length,
      amount: adminPaid.reduce((sum, o) => sum + (o.amount ?? 0), 0),
    },
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
  revenue: RevenueSummary;
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

  const [orders, grants, access, plans] = await Promise.all([
    // 결제창만 열고 나간 주문(READY)은 빼고 본다.
    db.from('orders').select('*').neq('status', 'READY').order('created_at', { ascending: false }),
    db.from('entitlement_grants').select('*'),
    db.from('cbt_access').select('*'),
    entitlementPlans(),
  ]);
  if (orders.error) throw new Error(`주문 조회 실패: ${orders.error.message}`);

  const orderRows = (orders.data ?? []) as OrderRow[];
  const ordersByUser = groupByUser(orderRows);
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
        plans,
      ),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    members,
    revenue: summarizeRevenue(
      orderRows,
      plans,
      new Set(members.filter((m) => m.isAdmin).map((m) => m.id)),
    ),
    grantsTableReady: !grants.error,
  };
}

// service_role 키가 없으면 'unavailable', 회원이 없으면 null.
export async function getMemberDetail(userId: string): Promise<MemberDetail | null | 'unavailable'> {
  const db = createAdminClient();
  if (!db) return 'unavailable';

  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data.user) return null;

  const [orders, grants, access, plans] = await Promise.all([
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
    entitlementPlans(),
  ]);
  if (orders.error) throw new Error(`주문 조회 실패: ${orders.error.message}`);

  const orderRows = (orders.data ?? []) as OrderRow[];
  const grantRows = (grants.error ? [] : grants.data ?? []) as GrantRow[];
  const accessRow = (access.data ?? null) as AccessRow | null;

  return {
    member: summarizeMember(data.user, orderRows, grantRows, accessRow, plans),
    orders: orderRows,
    grants: grantRows,
    access: accessRow,
    grantsTableReady: !grants.error,
  };
}
