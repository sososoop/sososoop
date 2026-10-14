import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isCbtProduct, periodLabelFor, resolveOrder } from '@/lib/products';
import { createClient } from '@/lib/supabase/server';
import { applyCoupon } from '@/lib/coupons';
import { isAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import CheckoutClient from './CheckoutClient';

// 로그인 세션을 매 요청 확인해야 하므로 정적 캐시하지 않는다.
export const dynamic = 'force-dynamic';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; items?: string; coupon?: string }>;
}) {
  const { product, items, coupon } = await searchParams;

  // 구매 내역을 소소숲 계정과 묶어야 결제 후 자동 접근이 되므로, 결제 전 로그인 필수.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const back =
      (product
        ? `/checkout?product=${encodeURIComponent(product)}`
        : `/checkout?items=${encodeURIComponent(items ?? '')}`) +
      (coupon ? `&coupon=${encodeURIComponent(coupon)}` : '');
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  // 단일 상품(구매하기) 또는 장바구니(items=id1,id2) 주문을 해석한다.
  const ids = product ? [product] : (items ?? '').split(',').filter(Boolean);
  const order = await resolveOrder(ids);

  if (!order) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[17px] font-semibold text-ink">주문할 상품을 찾을 수 없어요.</p>
        <Link href="/resources" className="text-primary underline text-[14px]">
          자료실로 돌아가기
        </Link>
      </main>
    );
  }

  // 쿠폰 적용·해제 때 같은 결제 화면을 다시 부를 주문 쿼리.
  const query = product
    ? `product=${encodeURIComponent(product)}`
    : `items=${encodeURIComponent(order.items.map((it) => it.id).join(','))}`;

  // 쿠폰: 서버가 할인액을 계산한다. 결제 직전 주문을 저장할 때 같은 계산을 한 번 더 한다.
  const applied = coupon ? await applyCoupon(order, coupon) : null;

  // 모의 CBT 이용권이 든 주문만 휴대폰 번호를 받는다(이용 안내 문자용). 전에 남긴 번호가 있으면 미리 채운다.
  const needPhone = (await Promise.all(order.items.map((it) => isCbtProduct(it.id)))).some(Boolean);
  const savedPhone = needPhone ? await lastPhone(user.id) : '';

  return (
    <CheckoutClient
      baseQuery={query}
      coupon={applied?.ok ? applied.coupon : null}
      couponError={applied && !applied.ok ? applied.message : ''}
      couponInput={coupon ?? ''}
      adminTest={isAdmin(user)}
      needPhone={needPhone}
      savedPhone={savedPhone}
      order={{
        orderName: order.orderName,
        amount: applied?.ok ? applied.total : order.total,
        lines: await Promise.all(
          order.items.map(async (it) => ({
            title: it.title,
            amount: it.amount,
            period: await periodLabelFor(it.id),
          })),
        ),
        ids: order.items.map((it) => it.id),
      }}
    />
  );
}

// 이 회원이 전에 남긴 휴대폰 번호: 최근 주문 → 무료 LIVE 신청 순으로 찾는다.
async function lastPhone(userId: string): Promise<string> {
  const db = createAdminClient();
  if (!db) return '';
  const { data: order } = await db
    .from('orders')
    .select('phone')
    .eq('user_id', userId)
    .not('phone', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (order?.phone) return order.phone;
  const { data: live } = await db
    .from('free_live_registrations')
    .select('phone')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return live?.phone ?? '';
}
