// 개인별 1회용 할인 쿠폰 — 서버 전용(service_role).
// 결제 화면과 결제 승인 화면이 같은 함수로 할인 금액을 계산해, 클라이언트가 보낸 금액을 믿지 않는다.
// 쿠폰은 결제 승인 직전에 '사용됨'으로 잡고(동시에 두 번 쓰기 방지), 승인이 실패하면 되돌린다.
import { createAdminClient } from '@/lib/supabase/admin';
import { getPurchasable, type Order } from '@/lib/products';

export type AppliedCoupon = {
  code: string;
  percent: number;
  discount: number;
  itemTitle: string;
};

export type CouponResult =
  | { ok: true; coupon: AppliedCoupon; total: number }
  | { ok: false; message: string };

export function normalizeCode(raw: string | null | undefined): string {
  return String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

// 주문에 쿠폰을 적용한 결과. orderId를 주면 그 주문이 이미 잡아 둔 쿠폰도 유효로 본다(승인 화면 새로고침 대비).
export async function applyCoupon(order: Order, rawCode: string, orderId?: string): Promise<CouponResult> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, message: '쿠폰 코드를 입력해 주세요.' };

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: '지금은 쿠폰을 확인할 수 없어요. 잠시 뒤 다시 시도해 주세요.' };

  const { data: row, error } = await admin
    .from('coupons')
    .select('code, product, percent, used_at, used_order_id')
    .eq('code', code)
    .maybeSingle();
  if (error) return { ok: false, message: '지금은 쿠폰을 확인할 수 없어요. 잠시 뒤 다시 시도해 주세요.' };
  if (!row) return { ok: false, message: '없는 쿠폰 코드예요. 철자를 다시 확인해 주세요.' };
  if (row.used_at && !(orderId && row.used_order_id === orderId)) {
    return { ok: false, message: '이미 사용한 쿠폰이에요.' };
  }

  const target = await getPurchasable(String(row.product));
  const item = target && order.items.find((it) => it.id === target.id);
  if (!item) return { ok: false, message: '이 쿠폰은 모의 CBT 이용권에만 쓸 수 있어요.' };

  const percent = Number(row.percent);
  const discount = Math.round((item.amount * percent) / 100);
  return {
    ok: true,
    coupon: { code, percent, discount, itemTitle: item.title },
    total: order.total - discount,
  };
}

// 결제 승인 직전: 아직 안 쓴 쿠폰을 이 주문에 묶는다. 이미 이 주문에 묶여 있으면 그대로 성공.
export async function claimCoupon(code: string, orderId: string, userId: string | null): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const { data } = await admin
    .from('coupons')
    .update({ used_at: new Date().toISOString(), used_by: userId, used_order_id: orderId })
    .eq('code', code)
    .is('used_at', null)
    .select('code');
  if (data && data.length > 0) return true;
  const { data: row } = await admin.from('coupons').select('used_order_id').eq('code', code).maybeSingle();
  return row?.used_order_id === orderId;
}

// 결제 승인이 실패하면 이 주문이 잡아 둔 쿠폰을 풀어 준다.
export async function releaseCoupon(code: string, orderId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin
    .from('coupons')
    .update({ used_at: null, used_by: null, used_order_id: null })
    .eq('code', code)
    .eq('used_order_id', orderId);
}
