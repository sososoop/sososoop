import Link from 'next/link';
import { resolveOrder, getPurchasable } from '@/lib/products';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { paidFilesFor } from '@/lib/paid-files';

export const dynamic = 'force-dynamic';

type Search = { [key: string]: string | string[] | undefined };

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

async function confirmPayment(paymentKey: string, orderId: string, amount: number) {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return { ok: false as const, message: '서버 결제 설정(시크릿 키)이 없습니다.' };
  }
  // 토스 인증: Basic base64("시크릿키:") — Workers 환경이라 btoa 사용
  const auth = btoa(`${secretKey}:`);
  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    return { ok: false as const, message: (data.message as string) || '결제 승인에 실패했습니다.' };
  }
  return { ok: true as const, data };
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const paymentKey = one(sp.paymentKey);
  const orderId = one(sp.orderId);
  const amount = Number(one(sp.amount));

  // 결제한 주문(단일 product 또는 장바구니 items)을 서버에서 다시 해석해 금액을 검증한다.
  const productParam = one(sp.product);
  const ids = productParam ? [productParam] : one(sp.items).split(',').filter(Boolean);
  const order = await resolveOrder(ids);

  // 주문에 CBT 이용권이 포함됐으면 결제완료 화면에서 바로 앱으로 갈 버튼을 띄운다.
  const cbt = await getPurchasable('cbt');
  const hasCbt = !!order && !!cbt && order.items.some((it) => it.id === cbt.id);
  // PDF 자료가 들어 있으면 마이페이지에서 받도록 안내한다.
  const hasFiles = !!order && order.items.some((it) => paidFilesFor(it.id).length > 0);

  // 1) 금액 위변조 검증 — 서버가 계산한 총액과 반드시 일치해야 승인 진행
  let result: Awaited<ReturnType<typeof confirmPayment>> | { ok: false; message: string };
  if (!paymentKey || !orderId || !amount) {
    result = { ok: false, message: '결제 정보가 올바르지 않습니다.' };
  } else if (!order || order.total !== amount) {
    result = { ok: false, message: '결제 금액이 주문 정보와 일치하지 않습니다.' };
  } else {
    // 2) 서버 승인
    result = await confirmPayment(paymentKey, orderId, amount);
  }

  // 결제수단에 따라 승인 결과 상태가 다르다.
  // 가상계좌는 즉시 완료가 아니라 '입금 대기(WAITING_FOR_DEPOSIT)' 상태로 승인된다.
  const confirmed = result.ok ? (result.data as Record<string, unknown>) : null;
  const status = (confirmed?.status as string) || 'DONE';
  const isDeposit = status === 'WAITING_FOR_DEPOSIT';
  const va = confirmed?.virtualAccount as
    | { accountNumber?: string; bank?: string; bankCode?: string; dueDate?: string }
    | undefined;

  // 3) 주문 기록 — 로그인 유저와 묶어 service_role로 저장(결제 후 자동 접근의 근거).
  //    세션으로 유저를 파악하고, 삽입은 RLS를 우회하는 admin 클라이언트로 한다
  //    (공개 anon 키로의 가짜 결제 위조 삽입을 막기 위해 orders 테이블엔 클라이언트 정책이 없음).
  if (result.ok && order) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const admin = createAdminClient();
      if (admin) {
        await admin.from('orders').insert({
          order_id: orderId,
          payment_key: paymentKey,
          user_id: user?.id ?? null,
          product_slug: order.items.map((it) => it.id).join(','),
          order_name: order.orderName,
          amount,
          status,
        });
      }
    } catch {
      // no-op
    }
  }

  if (!result.ok) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px] bg-pearl border border-hairline rounded-[18px] p-8 text-center">
          <h1 className="text-[19px] font-bold text-ink mb-2">결제를 완료하지 못했어요</h1>
          <p className="text-[14px] text-ink-muted leading-relaxed mb-6">{result.message}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-full bg-primary text-white text-[14px] font-medium"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  // 가상계좌: 입금 전이므로 '입금 안내' 화면을 보여준다.
  if (isDeposit) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px] bg-pearl border border-hairline rounded-[18px] p-8 text-center">
          <h1 className="text-[20px] font-bold text-ink mb-2">입금을 기다리고 있어요</h1>
          <p className="text-[14px] text-ink-muted leading-relaxed mb-6">
            아래 가상계좌로 입금하면 {order?.orderName} 이용이 시작돼요.
          </p>

          <div className="text-left bg-white border border-hairline rounded-[12px] p-5 mb-6 text-[13.5px]">
            {va?.accountNumber && (
              <div className="flex justify-between py-1.5">
                <span className="text-ink-muted">입금 계좌</span>
                <span className="text-ink font-semibold">
                  {va.bank ? `${va.bank} ` : ''}
                  {va.accountNumber}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5">
              <span className="text-ink-muted">입금 금액</span>
              <span className="text-ink font-semibold">{amount.toLocaleString()}원</span>
            </div>
            {va?.dueDate && (
              <div className="flex justify-between py-1.5">
                <span className="text-ink-muted">입금 기한</span>
                <span className="text-ink font-medium">
                  {new Date(va.dueDate).toLocaleString('ko-KR')}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5">
              <span className="text-ink-muted">주문번호</span>
              <span className="text-ink font-mono text-[12px]">{orderId}</span>
            </div>
          </div>

          <p className="text-[12px] text-ink-light leading-relaxed mb-5">
            입금이 확인되면 카카오채널로 안내드려요. 입금 기한이 지나면 주문이 자동
            취소됩니다.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-full bg-primary text-white text-[14px] font-medium"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-[440px] bg-pearl border border-hairline rounded-[18px] p-8 text-center">
        <h1 className="text-[20px] font-bold text-ink mb-2">결제가 완료되었어요</h1>
        <p className="text-[14px] text-ink-muted leading-relaxed mb-6">
          {order?.orderName} 구매가 정상 처리되었습니다.
        </p>

        <div className="text-left bg-white border border-hairline rounded-[12px] p-5 mb-6 text-[13.5px]">
          <div className="flex justify-between py-1.5">
            <span className="text-ink-muted">상품</span>
            <span className="text-ink font-medium">{order?.orderName}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-ink-muted">결제 금액</span>
            <span className="text-ink font-semibold">{amount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-ink-muted">주문번호</span>
            <span className="text-ink font-mono text-[12px]">{orderId}</span>
          </div>
        </div>

        {hasCbt ? (
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/slp-cbt-practice"
              className="inline-block w-full px-6 py-3.5 rounded-full bg-primary text-white text-[15px] font-semibold hover:bg-primary-dark transition-colors"
            >
              CBT 연습앱 시작하기 →
            </Link>
            <Link href="/" className="text-[13px] text-ink-muted underline">
              홈으로 돌아가기
            </Link>
          </div>
        ) : hasFiles ? (
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/mypage"
              className="inline-block w-full px-6 py-3.5 rounded-full bg-primary text-white text-[15px] font-semibold hover:bg-primary-dark transition-colors"
            >
              마이페이지에서 PDF 받기 →
            </Link>
            <Link href="/" className="text-[13px] text-ink-muted underline">
              홈으로 돌아가기
            </Link>
          </div>
        ) : (
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-full bg-primary text-white text-[14px] font-medium"
          >
            홈으로 돌아가기
          </Link>
        )}
      </div>
    </main>
  );
}
