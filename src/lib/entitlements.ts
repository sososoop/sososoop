// 이용권(entitlement) 조회 — 서버 전용.
// 이용권은 두 곳에서 생긴다.
//   1) 결제: orders 테이블에 status='DONE' 으로 기록된 주문
//   2) 관리자 지급: entitlement_grants 테이블의 취소되지 않은 행
// CBT는 결제일(지급일)부터 3개월만 쓸 수 있다(2026-10-03). 한글놀이는 아직 기간 검사가 없다.
// 조회는 RLS를 우회하는 service_role로 한다.
import { createAdminClient } from '@/lib/supabase/admin';
import { getPurchasable } from '@/lib/products';
import { CBT_PERIOD_MONTHS, periodEnd } from '@/lib/period';

export const ENTITLEMENT_PRODUCTS = [
  { alias: 'hangul', label: '한글놀이' },
  { alias: 'cbt', label: '모의 CBT' },
] as const;

export type EntitlementAlias = (typeof ENTITLEMENT_PRODUCTS)[number]['alias'];

export function isEntitlementAlias(value: string): value is EntitlementAlias {
  return ENTITLEMENT_PRODUCTS.some((p) => p.alias === value);
}

// product_slug 는 결제 상품 id(들)를 콤마로 연결한 문자열이다.
export function slugIds(productSlug: unknown): string[] {
  return String(productSlug ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// 이용권 별칭 → 그 상품으로 인정되는 product_slug 값들.
// 별칭은 결제 시점에 Notion 상품 UUID로 해석되어 저장되므로 별칭과 UUID 둘 다 포함한다.
async function idsFor(alias: EntitlementAlias): Promise<string[]> {
  const product = await getPurchasable(alias);
  return product ? [alias, product.id] : [alias];
}

export async function entitlementProductIds(): Promise<Record<EntitlementAlias, string[]>> {
  const entries = await Promise.all(
    ENTITLEMENT_PRODUCTS.map(async ({ alias }) => [alias, await idsFor(alias)] as const),
  );
  return Object.fromEntries(entries) as Record<EntitlementAlias, string[]>;
}

// 이용권별 이용기간(개월). 없으면 기간 검사를 하지 않는다.
const PERIOD_MONTHS: Partial<Record<EntitlementAlias, number>> = { cbt: CBT_PERIOD_MONTHS };

// 결제일·지급일에서 이 이용권이 끝나는 시각. 기간 검사가 없는 이용권은 null(계속).
export function entitlementEnd(alias: EntitlementAlias, startedAt: string): Date | null {
  const months = PERIOD_MONTHS[alias];
  return months ? periodEnd(startedAt, months) : null;
}

export function isEntitlementActive(
  alias: EntitlementAlias,
  startedAt: string,
  now = Date.now(),
): boolean {
  const end = entitlementEnd(alias, startedAt);
  return !end || end.getTime() > now;
}

export type EntitlementStatus = {
  ok: boolean;
  // 기간이 있는 이용권: 가장 늦게 끝나는 날(이미 끝났으면 끝난 날). 기간 검사가 없거나 산 적이 없으면 null.
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

  const [ids, orders, grants] = await Promise.all([
    idsFor(alias),
    admin
      .from('orders')
      .select('product_slug, created_at')
      .eq('user_id', userId)
      .eq('status', 'DONE'),
    admin
      .from('entitlement_grants')
      .select('granted_at')
      .eq('user_id', userId)
      .eq('product', alias)
      .is('revoked_at', null),
  ]);

  // 이용을 시작한 때 = 결제일 또는 지급일
  const starts: string[] = [];
  if (!orders.error) {
    for (const row of orders.data ?? []) {
      if (slugIds(row.product_slug).some((id) => ids.includes(id))) starts.push(row.created_at);
    }
  }
  // 지급 테이블이 아직 없으면(SQL 미실행) 에러가 난다 → 지급 없음으로 본다.
  if (!grants.error) {
    for (const row of grants.data ?? []) starts.push(row.granted_at);
  }
  if (starts.length === 0) return none;

  const ends = starts.map((start) => entitlementEnd(alias, start));
  if (ends.some((end) => end === null)) return { ok: true, expiresAt: null };
  const latest = new Date(Math.max(...ends.map((end) => (end as Date).getTime())));
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

// 한글놀이 이용권 보유 여부.
export async function hasHangulEntitlement(userId: string | undefined | null): Promise<boolean> {
  return (await getEntitlement(userId, 'hangul')).ok;
}
