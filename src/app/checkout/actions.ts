'use server';

// 결제창을 열기 직전에 주문을 'READY'(결제 전)로 먼저 저장한다.
// 결제 완료 화면은 주소에 붙은 상품·쿠폰이 아니라 이 기록(구매자·상품·최종 금액·쿠폰)으로 승인하므로,
// 주소를 고쳐 다른 상품으로 기록하거나, 결제 중 로그인이 풀려 주문이 계정에 안 묶이는 일이 없다.
// 결제를 안 하고 나간 주문은 READY로 남고, 이용권·관리자 화면·마이페이지에서는 보이지 않는다.
import { isCbtProduct, resolveOrder } from '@/lib/products';
import { normalizePhone, PHONE_ERROR } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyCoupon } from '@/lib/coupons';
import { isAdmin } from '@/lib/admin';
import { ADMIN_TEST_ORDER_PREFIX } from '@/lib/test-order';

export type PreparedOrder =
  | { ok: true; orderId: string; orderName: string; amount: number }
  | { ok: false; message: string };

export async function prepareOrder(input: {
  ids: string[];
  coupon?: string;
  adminTest?: boolean;
  phone?: string;
  phoneAgreed?: boolean;
  marketingAgreed?: boolean;
}): Promise<PreparedOrder> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: '로그인이 풀렸어요. 다시 로그인한 뒤 결제해 주세요.' };
  if (input.adminTest && !isAdmin(user)) {
    return { ok: false, message: '관리자 테스트 주문은 관리자 계정으로만 할 수 있어요.' };
  }

  const order = await resolveOrder(input.ids);
  if (!order) return { ok: false, message: '주문할 상품을 찾을 수 없어요.' };

  const applied = input.coupon ? await applyCoupon(order, input.coupon) : null;
  if (applied && !applied.ok) return { ok: false, message: applied.message };

  // 모의 CBT 이용권이 든 주문은 휴대폰 번호와 [필수] 동의가 있어야 한다. 화면이 아니라 여기서 다시 확인한다.
  const needPhone = (await Promise.all(order.items.map((it) => isCbtProduct(it.id)))).some(Boolean);
  const phone = needPhone ? normalizePhone(input.phone ?? '') : null;
  if (needPhone && !phone) return { ok: false, message: PHONE_ERROR };
  if (needPhone && !input.phoneAgreed) return { ok: false, message: '휴대폰 번호 수집·이용에 동의해 주세요.' };
  const now = new Date().toISOString();

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: '지금은 결제를 시작할 수 없어요. 잠시 뒤 다시 시도해 주세요.' };

  const orderId = `sososoop-${input.adminTest ? 'test-' : ''}${crypto.randomUUID()}`.slice(0, 64);
  const amount = applied?.ok ? applied.total : order.total;
  const { error } = await admin.from('orders').insert({
    order_id: orderId,
    user_id: user.id,
    product_slug: order.items.map((it) => it.id).join(','),
    order_name: input.adminTest ? `${ADMIN_TEST_ORDER_PREFIX}${order.orderName}` : order.orderName,
    amount,
    status: 'READY',
    ...(applied?.ok ? { coupon_code: applied.coupon.code, discount: applied.coupon.discount } : {}),
    ...(phone
      ? { phone, phone_agreed_at: now, marketing_agreed_at: input.marketingAgreed ? now : null }
      : {}),
  });
  if (error) {
    console.error('[checkout] 주문 준비 실패', error.code, error.message);
    return { ok: false, message: '지금은 결제를 시작할 수 없어요. 잠시 뒤 다시 시도해 주세요.' };
  }

  return { ok: true, orderId, orderName: order.orderName, amount };
}
