// 이용권(entitlement) 조회 — 서버 전용.
// 이용권은 두 곳에서 생긴다.
//   1) 결제: orders 테이블에 status='DONE' 으로 기록된 주문
//   2) 관리자 지급: entitlement_grants 테이블의 취소되지 않은 행
// 이용기간은 결제일(지급일)부터 센다. CBT 3개월(2026-10-03).
// 한글놀이는 2026-10-17부터 상품에 따라 6개월·12개월, 관리자 지급은 지급 때 고른 기간(기본 12개월).
// 조회는 RLS를 우회하는 service_role로 한다.
import { createAdminClient } from '@/lib/supabase/admin';
import { aliasProductIds, PRODUCT_ALIASES, type ProductAlias } from '@/lib/products';
import { CBT_PERIOD_MONTHS, periodEnd } from '@/lib/period';

export const ENTITLEMENT_PRODUCTS = [
  { alias: 'hangul', label: '한글놀이' },
  { alias: 'cbt', label: '모의 CBT' },
] as const;

export type EntitlementAlias = (typeof ENTITLEMENT_PRODUCTS)[number]['alias'];

export function isEntitlementAlias(value: string): value is EntitlementAlias {
  return ENTITLEMENT_PRODUCTS.some((p) => p.alias === value);
}

// 이용권별로 인정하는 결제 상품(별칭). 기간은 products.ts PRODUCT_ALIASES 에 있다.
const PLAN_ALIASES: Record<EntitlementAlias, readonly ProductAlias[]> = {
  hangul: ['hangul', 'hangul12'],
  cbt: ['cbt'],
};

// 관리자 지급 때 고를 수 있는 이용기간(개월, 지급일부터). 첫 값이 기본값이다.
// 지급 행의 months 가 비어 있으면(칸 추가 전 지급) 기본값으로 센다.
export const GRANT_MONTH_OPTIONS: Record<EntitlementAlias, readonly number[]> = {
  hangul: [12, 6],
  cbt: [CBT_PERIOD_MONTHS],
};

export function grantMonths(alias: EntitlementAlias, months?: number | null): number {
  const options = GRANT_MONTH_OPTIONS[alias];
  return months && options.includes(months) ? months : options[0];
}

export type GrantPeriod = { granted_at: string; months?: number | null };

// product_slug 는 결제 상품 id(들)를 콤마로 연결한 문자열이다.
export function slugIds(productSlug: unknown): string[] {
  return String(productSlug ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// 이용권 별칭 → { 그 상품으로 인정되는 product_slug 값: 이용기간(개월) }.
// 별칭은 결제 시점에 Notion 상품 UUID로 해석되어 저장되므로 별칭과 UUID 둘 다 넣는다.
export type EntitlementPlans = Record<EntitlementAlias, Record<string, number>>;

async function plansFor(alias: EntitlementAlias): Promise<Record<string, number>> {
  const ids = await aliasProductIds(PLAN_ALIASES[alias]);
  const out: Record<string, number> = {};
  for (const plan of PLAN_ALIASES[alias]) {
    const months = PRODUCT_ALIASES[plan].months;
    out[plan] = months;
    const id = ids[plan];
    if (id) out[id] = Math.max(out[id] ?? 0, months);
  }
  return out;
}

export async function entitlementPlans(): Promise<EntitlementPlans> {
  const entries = await Promise.all(
    ENTITLEMENT_PRODUCTS.map(async ({ alias }) => [alias, await plansFor(alias)] as const),
  );
  return Object.fromEntries(entries) as EntitlementPlans;
}

// 이용권 별칭 → 그 상품으로 인정되는 product_slug 값들.
export async function entitlementProductIds(): Promise<Record<EntitlementAlias, string[]>> {
  const plans = await entitlementPlans();
  return Object.fromEntries(
    Object.entries(plans).map(([alias, ids]) => [alias, Object.keys(ids)]),
  ) as Record<EntitlementAlias, string[]>;
}

// 결제 한 건으로 이 이용권을 쓸 수 있는 마지막 시각. 이 이용권 상품이 없는 주문이면 null.
// 한 주문에 기간이 다른 상품이 같이 있으면 긴 쪽으로 본다.
export function orderEnd(
  plans: Record<string, number>,
  productSlug: unknown,
  paidAt: string,
): Date | null {
  const months = Math.max(0, ...slugIds(productSlug).map((id) => plans[id] ?? 0));
  return months ? periodEnd(paidAt, months) : null;
}

// 관리자 지급 한 건이 끝나는 시각.
export function grantEnd(alias: EntitlementAlias, grant: GrantPeriod): Date {
  return periodEnd(grant.granted_at, grantMonths(alias, grant.months));
}

export function isGrantActive(alias: EntitlementAlias, grant: GrantPeriod, now = Date.now()): boolean {
  return grantEnd(alias, grant).getTime() > now;
}

export type EntitlementStatus = {
  ok: boolean;
  // 가장 늦게 끝나는 날(이미 끝났으면 끝난 날). 산 적이 없으면 null.
  expiresAt: Date | null;
};

async function getEntitlement(
  userId: string | undefined | null,
  alias: EntitlementAlias,
): Promise<EntitlementStatus> {
  const none: EntitlementStatus = { ok: false, expiresAt: null };
  if (!userId) return none;
  const admin = createAdminClient();
  if (!admin) return none;

  const [plans, orders, grants] = await Promise.all([
    plansFor(alias),
    admin
      .from('orders')
      .select('product_slug, created_at')
      .eq('user_id', userId)
      .eq('status', 'DONE'),
    admin
      .from('entitlement_grants')
      .select('*') // months 칸이 아직 없어도 에러가 나지 않게
      .eq('user_id', userId)
      .eq('product', alias)
      .is('revoked_at', null),
  ]);

  // 결제·지급 한 건마다 끝나는 날
  const ends: Date[] = [];
  if (!orders.error) {
    for (const row of orders.data ?? []) {
      const end = orderEnd(plans, row.product_slug, row.created_at);
      if (end) ends.push(end);
    }
  }
  // 지급 테이블이 아직 없으면(SQL 미실행) 에러가 난다 → 지급 없음으로 본다.
  if (!grants.error) {
    for (const row of grants.data ?? []) ends.push(grantEnd(alias, row as GrantPeriod));
  }
  if (ends.length === 0) return none;

  const latest = new Date(Math.max(...ends.map((end) => end.getTime())));
  return { ok: latest.getTime() > Date.now(), expiresAt: latest };
}

// CBT 이용권 상태 — 이용 가능 여부와 끝나는 날.
export function getCbtEntitlement(userId: string | undefined | null): Promise<EntitlementStatus> {
  return getEntitlement(userId, 'cbt');
}

// CBT 연습앱 이용권 보유 여부.
export async function hasCbtEntitlement(userId: string | undefined | null): Promise<boolean> {
  return (await getEntitlement(userId, 'cbt')).ok;
}

// 한글놀이 이용권 상태 — 이용 가능 여부와 끝나는 날.
export function getHangulEntitlement(userId: string | undefined | null): Promise<EntitlementStatus> {
  return getEntitlement(userId, 'hangul');
}

// 한글놀이 이용권 보유 여부.
export async function hasHangulEntitlement(userId: string | undefined | null): Promise<boolean> {
  return (await getEntitlement(userId, 'hangul')).ok;
}
