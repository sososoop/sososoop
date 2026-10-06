import Link from 'next/link';
import { redirect } from 'next/navigation';
import { periodLabelFor, resolveOrder } from '@/lib/products';
import { createClient } from '@/lib/supabase/server';
import { applyCoupon } from '@/lib/coupons';
import { isAdmin } from '@/lib/admin';
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

  // 결제 성공/실패 후 서버가 같은 주문을 재해석해 금액을 검증하도록 쿼리를 그대로 넘긴다.
  const query = product
    ? `product=${encodeURIComponent(product)}`
    : `items=${encodeURIComponent(order.items.map((it) => it.id).join(','))}`;

  // 쿠폰: 서버가 할인액을 계산한다. 결제 승인 화면도 같은 계산으로 금액을 다시 확인한다.
  const applied = coupon ? await applyCoupon(order, coupon) : null;
  const couponQuery = applied?.ok ? `&coupon=${encodeURIComponent(applied.coupon.code)}` : '';

  return (
    <CheckoutClient
      baseQuery={query}
      coupon={applied?.ok ? applied.coupon : null}
      couponError={applied && !applied.ok ? applied.message : ''}
      couponInput={coupon ?? ''}
      adminTest={isAdmin(user)}
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
        query: query + couponQuery,
      }}
    />
  );
}
