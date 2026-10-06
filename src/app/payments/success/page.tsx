import Link from 'next/link';
import { resolveOrder, getPurchasable } from '@/lib/products';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { paidFilesFor } from '@/lib/paid-files';
import { claimCoupon, releaseCoupon } from '@/lib/coupons';
import { isAdmin } from '@/lib/admin';
import { ADMIN_TEST_PAYMENT_KEY } from '@/lib/test-order';

export const dynamic = 'force-dynamic';

type Search = { [key: string]: string | string[] | undefined };

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

type TossResult =
  | { ok: true; data: Record<string, unknown> }
  // retry: 승인 여부를 확인하지 못함(연결 오류 등) — 쿠폰을 풀지 않고 새로고침으로 다시 확인하게 한다.
  | { ok: false; message: string; retry?: boolean };

function tossAuth(): string | null {
  const secretKey = process.env.TOSS_SECRET_KEY;
  // 토스 인증: Basic base64("시크릿키:") — Workers 환경이라 btoa 사용
  return secretKey ? `Basic ${btoa(`${secretKey}:`)}` : null;
}

// 이미 승인된 결제를 토스에서 다시 조회한다(승인 응답을 못 받았거나 중복 승인 오류일 때).
async function lookupPayment(paymentKey: string, orderId: string, amount: number): Promise<TossResult> {
  const auth = tossAuth();
  if (!auth) return { ok: false, message: '서버 결제 설정(시크릿 키)이 없습니다.' };
  try {
    const res = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`, {
      headers: { Authorization: auth },
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) return { ok: false, message: '결제 확인이 늦어지고 있어요.', retry: true };
    const status = String(data.status ?? '');
    if (data.orderId !== orderId || Number(data.totalAmount) !== amount) {
      return { ok: false, message: '결제 정보가 주문과 일치하지 않습니다.' };
    }
    if (status !== 'DONE' && status !== 'WAITING_FOR_DEPOSIT') {
      return { ok: false, message: '승인되지 않은 결제입니다.' };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, message: '결제 확인이 늦어지고 있어요.', retry: true };
  }
}

async function confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<TossResult> {
  const auth = tossAuth();
  if (!auth) return { ok: false, message: '서버 결제 설정(시크릿 키)이 없습니다.' };
  let res: Response;
  let data: Record<string, unknown>;
  try {
    res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    // 승인됐는지 모르는 상태 — 토스에 다시 물어본다.
    return lookupPayment(paymentKey, orderId, amount);
  }
  if (res.ok) return { ok: true, data };
  // 같은 결제를 두 번 승인하려 한 경우(새로고침·동시 요청)나 토스 서버 오류 — 승인됐는지 조회해 이어 간다.
  if (data.code === 'ALREADY_PROCESSED_PAYMENT' || res.status >= 500) {
    return lookupPayment(paymentKey, orderId, amount);
  }
  return { ok: false, message: (data.message as string) || '결제 승인에 실패했습니다.' };
}

type SavedOrder = {
  user_id: string | null;
  payment_key: string | null;
  product_slug: string | null;
  status: string | null;
  amount: number | null;
  coupon_code: string | null;
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const paymentKey = one(sp.paymentKey);
  const orderId = one(sp.orderId);
  const amount = Number(one(sp.amount));
  const admin = createAdminClient();

  // 주문은 결제창을 열기 전에 서버가 'READY'로 저장해 둔다(checkout/actions.ts).
  // 구매자·상품·최종 금액·쿠폰은 주소가 아니라 이 기록을 믿는다.
  let saved: SavedOrder | null = null;
  if (admin && orderId) {
    const { data } = await admin
      .from('orders')
      .select('user_id, payment_key, product_slug, status, amount, coupon_code')
      .eq('order_id', orderId)
      .maybeSingle();
    saved = (data as SavedOrder | null) ?? null;
  }

  const order = saved?.product_slug ? await resolveOrder(saved.product_slug.split(',')) : null;

  // 주문에 CBT 이용권이 포함됐으면 결제완료 화면에서 바로 앱으로 갈 버튼을 띄운다.
  const cbt = await getPurchasable('cbt');
  const hasCbt = !!order && !!cbt && order.items.some((it) => it.id === cbt.id);
  // PDF 자료가 들어 있으면 마이페이지에서 받도록 안내한다.
  const hasFiles = !!order && order.items.some((it) => paidFilesFor(it.id).length > 0);

  // 로그인 유저 — 관리자 테스트 주문 확인용(주문의 구매자는 저장된 기록을 쓴다)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 관리자 테스트 주문: 관리자 세션일 때만 토스 승인 없이 완료로 본다(쿠폰 사용 처리는 실제와 같다).
  const isTest = paymentKey === ADMIN_TEST_PAYMENT_KEY;
  const couponCode = saved?.coupon_code ?? null;

  let result: TossResult;
  // 결제는 됐는데 기록이 안 되면 이용권이 열리지 않으니, 실패를 숨기지 않고 따로 안내한다.
  let recordFailed = false;
  if (!paymentKey || !orderId || !amount) {
    result = { ok: false, message: '결제 정보가 올바르지 않습니다.' };
  } else if (!admin) {
    result = { ok: false, message: '결제 확인이 늦어지고 있어요.', retry: true };
  } else if (!saved) {
    // 결제창을 열기 전에 저장한 주문이 없다 — 승인하지 않았으니 청구되지 않는다.
    result = { ok: false, message: '주문 정보를 찾을 수 없어 결제를 진행하지 않았어요. 다시 시도해 주세요.' };
  } else if (saved.status === 'DONE' || saved.status === 'WAITING_FOR_DEPOSIT') {
    // 이미 처리한 주문(새로고침·뒤로 가기) — 같은 결제일 때만 완료로 본다. 쿠폰은 건드리지 않는다.
    result =
      saved.payment_key === paymentKey
        ? { ok: true, data: { status: saved.status } }
        : { ok: false, message: '결제 정보가 주문과 일치하지 않습니다.' };
  } else if (saved.status !== 'READY') {
    result = { ok: false, message: '취소된 주문이에요.' };
  } else if (isTest && !isAdmin(user)) {
    result = { ok: false, message: '관리자 테스트 주문은 관리자 계정으로만 할 수 있어요.' };
  } else if (!order || Number(saved.amount) !== amount) {
    // 1) 금액 위변조 검증 — 결제 전에 저장한 최종 금액과 반드시 일치해야 승인 진행
    result = { ok: false, message: '결제 금액이 주문 정보와 일치하지 않습니다.' };
  } else if (couponCode && !(await claimCoupon(couponCode, orderId, saved.user_id))) {
    // 같은 쿠폰으로 동시에 결제한 경우 — 승인 전에 막는다(청구되지 않음).
    result = { ok: false, message: '이미 사용한 쿠폰이라 결제를 진행하지 않았어요.' };
  } else {
    // 2) 서버 승인(관리자 테스트는 토스를 부르지 않는다)
    result = isTest ? { ok: true, data: { status: 'DONE' } } : await confirmPayment(paymentKey, orderId, amount);
    // 승인이 확실히 실패했을 때만 쿠폰을 풀어 준다(확인 못 한 상태면 그대로 두고 새로고침으로 다시 확인).
    if (!result.ok && !result.retry && couponCode) await releaseCoupon(couponCode, orderId);

    // 3) 주문 완료 기록 — 기간은 결제가 승인된 시각부터 센다(created_at을 승인 시각으로 바꿈).
    if (result.ok) {
      const approvedAt = String(result.data.approvedAt ?? '') || new Date().toISOString();
      const done = String(result.data.status ?? '') || 'DONE';
      const { data: updated, error } = await admin
        .from('orders')
        .update({
          status: done,
          payment_key: paymentKey,
          created_at: approvedAt,
          ...(isTest ? { amount: 0 } : {}),
        })
        .eq('order_id', orderId)
        .eq('status', 'READY')
        .select('order_id');
      if (error) {
        recordFailed = true;
        console.error('[payments/success] 주문 기록 실패', orderId, error.code, error.message);
      } else if (!updated || updated.length === 0) {
        // 동시 요청이 먼저 기록했는지 확인
        const { data: again } = await admin
          .from('orders')
          .select('status, payment_key')
          .eq('order_id', orderId)
          .maybeSingle();
        if (!again || again.payment_key !== paymentKey || again.status === 'READY') {
          recordFailed = true;
          console.error('[payments/success] 주문 기록 확인 실패', orderId);
        }
      }
    }
  }

  // 결제수단에 따라 승인 결과 상태가 다르다.
  // 가상계좌는 즉시 완료가 아니라 '입금 대기(WAITING_FOR_DEPOSIT)' 상태로 승인된다.
  const confirmed = result.ok ? result.data : null;
  const status = (confirmed?.status as string) || 'DONE';
  const isDeposit = status === 'WAITING_FOR_DEPOSIT';
  const va = confirmed?.virtualAccount as
    | { accountNumber?: string; bank?: string; bankCode?: string; dueDate?: string }
    | undefined;

  if (recordFailed) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px] bg-pearl border border-hairline rounded-[18px] p-8 text-center">
          <h1 className="text-[19px] font-bold text-ink mb-2">결제는 완료됐지만 주문 기록에 문제가 생겼어요</h1>
          <p className="text-[14px] text-ink-muted leading-relaxed mb-5">
            다시 결제하지 마시고, 아래 주문번호와 함께 카카오채널로 알려 주세요. 확인하는 대로 바로 열어 드릴게요.
          </p>
          <p className="text-ink font-mono text-[12px] bg-white border border-hairline rounded-[10px] px-3 py-2 mb-6 break-all">
            {orderId}
          </p>
          <a
            href="http://pf.kakao.com/_gngTX/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-full bg-primary text-white text-[14px] font-medium"
          >
            카카오채널로 알리기
          </a>
        </div>
      </main>
    );
  }

  if (!result.ok && result.retry) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px] bg-pearl border border-hairline rounded-[18px] p-8 text-center">
          <h1 className="text-[19px] font-bold text-ink mb-2">결제 확인이 늦어지고 있어요</h1>
          <p className="text-[14px] text-ink-muted leading-relaxed mb-6">
            잠시 뒤 이 화면을 새로고침해 주세요. 다시 결제하지 않으셔도 돼요.
            계속 이 화면이 나오면 주문번호({orderId})와 함께 카카오채널로 알려 주세요.
          </p>
          <a
            href="http://pf.kakao.com/_gngTX/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-full bg-primary text-white text-[14px] font-medium"
          >
            카카오채널로 알리기
          </a>
        </div>
      </main>
    );
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
        {isTest && (
          <p className="mb-4 px-3 py-2 rounded-[10px] bg-ink text-white text-[12.5px] leading-relaxed">
            관리자 테스트 주문이에요. 실제 결제는 되지 않았고 주문은 0원으로 기록됐어요.
            확인이 끝나면 관리자 회원 화면에서 이 주문을 취소해 주세요.
          </p>
        )}
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
            {hasFiles && (
              <Link href="/mypage" className="text-[13px] text-primary font-semibold underline">
                구매 선물(1·2급 기출유형분석 심화판)은 마이페이지에서 받기
              </Link>
            )}
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
