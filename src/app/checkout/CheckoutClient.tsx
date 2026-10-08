'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import { ADMIN_TEST_PAYMENT_KEY } from '@/lib/test-order';
import { prepareOrder } from './actions';

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

type Order = {
  orderName: string;
  amount: number;
  lines: { title: string; amount: number; period: string }[];
  ids: string[]; // 주문할 상품 id — 결제 직전에 서버가 이걸로 주문을 다시 만들어 저장한다
};

type Coupon = { code: string; percent: number; discount: number; itemTitle: string };

// 토스에서 활성화한 결제수단만 노출한다(카드·간편결제 / 계좌이체).
// 미신청 수단(가상계좌·휴대폰)은 고르면 토스 창에서 에러가 나므로 숨김.
type MethodKey = 'CARD' | 'TRANSFER';

const METHODS: { key: MethodKey; label: string; desc: string }[] = [
  {
    key: 'CARD',
    label: '카드 · 간편결제',
    desc: '신용·체크카드, 카카오페이·네이버페이·토스페이 등',
  },
  { key: 'TRANSFER', label: '계좌이체', desc: '은행 계좌에서 바로 이체' },
];

export default function CheckoutClient({
  order,
  baseQuery,
  coupon,
  couponError,
  couponInput,
  adminTest,
}: {
  order: Order;
  baseQuery: string; // 쿠폰을 뺀 주문 쿼리
  coupon: Coupon | null;
  couponError: string;
  couponInput: string;
  adminTest: boolean; // 관리자 로그인이면 실제 결제 없이 완료 화면으로 가는 테스트 버튼을 보여 준다
}) {
  const router = useRouter();
  const [code, setCode] = useState(coupon?.code ?? couponInput);
  const [applying, startApply] = useTransition();
  const [selected, setSelected] = useState<MethodKey>('CARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 쿠폰 적용·해제는 같은 결제 화면을 다시 불러 서버가 금액을 계산하게 한다.
  function applyCode() {
    const c = code.trim();
    if (!c) return;
    startApply(() => {
      router.replace(`/checkout?${baseQuery}&coupon=${encodeURIComponent(c)}`, { scroll: false });
    });
  }

  function removeCode() {
    setCode('');
    router.replace(`/checkout?${baseQuery}`, { scroll: false });
  }

  // 결제창을 열기 전에 서버에 주문(구매자·상품·최종 금액·쿠폰)을 먼저 저장한다.
  async function prepare(adminTest = false) {
    const prepared = await prepareOrder({ ids: order.ids, coupon: coupon?.code, adminTest });
    if (!prepared.ok) throw new Error(prepared.message);
    return prepared;
  }

  // 관리자 테스트: 토스 결제창 대신 결제 완료 화면으로 바로 보낸다(서버가 관리자 세션을 다시 확인).
  async function handleAdminTest() {
    setError('');
    setLoading(true);
    try {
      const prepared = await prepare(true);
      const params = `paymentKey=${ADMIN_TEST_PAYMENT_KEY}&orderId=${prepared.orderId}&amount=${prepared.amount}`;
      window.location.href = `/payments/success?${params}`;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '테스트 주문을 시작하지 못했습니다.');
      setLoading(false);
    }
  }

  async function handlePay() {
    setError('');
    if (!CLIENT_KEY) {
      setError('결제 설정이 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const prepared = await prepare();
      const tossPayments = await loadTossPayments(CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      const base = {
        amount: { currency: 'KRW' as const, value: prepared.amount },
        orderId: prepared.orderId,
        orderName: prepared.orderName,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
      };

      if (selected === 'CARD') {
        await payment.requestPayment({
          ...base,
          method: 'CARD',
          card: {
            useEscrow: false,
            flowMode: 'DEFAULT', // 카드+간편결제 통합결제창
            useCardPoint: false,
            useAppCardOnly: false,
          },
        });
      } else {
        // 계좌이체는 현재 페이지를 결제창으로 이동(self) — iframe 갇힘/타임아웃 후 닫기불가 방지
        await payment.requestPayment({ ...base, method: 'TRANSFER', windowTarget: 'self' });
      }
    } catch (e: unknown) {
      // 사용자가 결제창을 닫은 경우 등
      const msg = e instanceof Error ? e.message : '결제를 시작하지 못했습니다.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-start justify-center px-5 py-12">
      <div className="w-full max-w-[520px]">
        <h1 className="text-[22px] font-bold text-ink mb-1">주문 / 결제</h1>
        <p className="text-[13px] text-ink-light mb-6">
          원하는 결제수단을 선택하고 결제해 주세요.
        </p>

        {/* 주문 요약 */}
        <div className="bg-pearl border border-hairline rounded-[16px] p-6 mb-5">
          {order.lines.map((line, i) => (
            <div
              key={i}
              className={`flex items-start justify-between gap-4 py-1.5 ${
                i > 0 ? 'border-t border-hairline pt-2.5 mt-1' : ''
              }`}
            >
              <span className="text-[14.5px] text-ink leading-snug">
                {line.title}
                <span className="block text-[12px] text-ink-muted mt-0.5">이용기간: {line.period}</span>
              </span>
              <span className="text-[14.5px] text-ink font-medium whitespace-nowrap">
                {line.amount.toLocaleString()}원
              </span>
            </div>
          ))}
          {coupon && (
            <div className="flex items-start justify-between gap-4 border-t border-hairline pt-2.5 mt-1">
              <span className="text-[13.5px] text-primary leading-snug">
                쿠폰 할인 {coupon.percent}%
                <span className="block text-[12px] text-ink-muted mt-0.5">{coupon.itemTitle}</span>
              </span>
              <span className="text-[14.5px] text-primary font-semibold whitespace-nowrap">
                −{coupon.discount.toLocaleString()}원
              </span>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-hairline pt-3 mt-2">
            <span className="text-[13px] text-ink-muted">
              총 결제금액 ({order.lines.length}개)
            </span>
            <span className="text-[22px] font-bold text-ink">
              {order.amount.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 쿠폰 */}
        <p className="text-[13px] font-semibold text-ink mb-2.5 px-1">쿠폰</p>
        {coupon ? (
          <div className="flex items-center justify-between gap-3 mb-5 px-4 py-3 rounded-[14px] border border-primary bg-primary/5">
            <span className="text-[14px] text-ink">
              <span className="font-mono font-semibold">{coupon.code}</span>
              <span className="text-ink-muted"> · {coupon.percent}% 할인 적용됨</span>
            </span>
            <button type="button" onClick={removeCode} className="text-[12.5px] text-ink-muted underline shrink-0">
              빼기
            </button>
          </div>
        ) : (
          <div className="mb-5">
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyCode()}
                placeholder="쿠폰 코드 입력"
                autoCapitalize="characters"
                className="flex-1 min-w-0 px-4 py-3 rounded-[14px] border border-hairline bg-pearl text-[14.5px] font-mono uppercase outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={applyCode}
                disabled={!code.trim() || applying}
                className="shrink-0 px-5 rounded-[14px] bg-ink text-white text-[14px] font-semibold disabled:opacity-40"
              >
                {applying ? '확인 중…' : '적용'}
              </button>
            </div>
            {couponError && !applying && (
              <p className="text-[12.5px] text-red-600 mt-2 px-1">{couponError}</p>
            )}
          </div>
        )}

        {/* 결제수단 선택 */}
        <p className="text-[13px] font-semibold text-ink mb-2.5 px-1">결제수단</p>
        <div className="flex flex-col gap-2.5 mb-5">
          {METHODS.map((m) => {
            const active = selected === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelected(m.key)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-[14px] border transition-colors ${
                  active
                    ? 'border-primary bg-primary/5'
                    : 'border-hairline bg-pearl hover:border-primary/40'
                }`}
              >
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold text-ink">{m.label}</span>
                  <span className="block text-[12px] text-ink-muted mt-0.5">{m.desc}</span>
                </span>
                <span
                  className={`shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${
                    active ? 'border-primary' : 'border-hairline'
                  }`}
                >
                  {active && <span className="w-[9px] h-[9px] rounded-full bg-primary" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* 임시 안내(2026-10-08~): 토스가 현대카드에 하위몰 등록을 마치기 전까지 현대카드 승인이 거절된다
            (NOT_REGISTERED_SUBMALL). 등록이 끝나 현대카드 결제가 되면 이 블록을 지운다. */}
        <p className="text-[12.5px] text-ink-muted leading-relaxed bg-pearl border border-hairline rounded-[12px] px-4 py-3 mb-5">
          <b className="text-ink">현대카드</b>는 카드사 등록 절차가 진행 중이라 지금 결제가 잠시 안 돼요.
          다른 카드사 카드나 계좌이체로 결제해 주세요.
        </p>

        {error &&<p className="text-[13px] text-red-600 mb-3 leading-relaxed px-1">{error}</p>}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3.5 rounded-full bg-primary text-white text-[16px] font-semibold hover:bg-primary-dark transition-colors active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? '결제창을 여는 중…' : `${order.amount.toLocaleString()}원 결제하기`}
        </button>

        {adminTest && (
          <div className="mt-4 px-4 py-3.5 rounded-[14px] border border-dashed border-ink-muted/50 bg-white">
            <p className="text-[12.5px] text-ink-muted leading-relaxed mb-2.5">
              관리자 전용 · 실제 결제 없이 쿠폰 사용, 주문 기록, 마이페이지 선물 받기까지 확인합니다.
              주문은 0원으로 기록되고, 쿠폰은 실제처럼 사용 처리돼요.
            </p>
            <button
              type="button"
              onClick={handleAdminTest}
              className="w-full py-2.5 rounded-full bg-ink text-white text-[14px] font-semibold"
            >
              관리자 테스트 주문 ({order.amount.toLocaleString()}원으로 가정)
            </button>
          </div>
        )}

        <p className="text-[11.5px] text-ink-light leading-relaxed mt-4 text-center">
          결제하기를 누르면 주문 내용과{' '}
          <Link href="/terms" target="_blank" className="underline">이용약관</Link>·
          <Link href="/refund" target="_blank" className="underline">환불정책</Link>을 확인하고
          결제에 동의한 것으로 봅니다. · 토스페이먼츠 안전결제
        </p>
        <Link
          href="/cart"
          className="block text-center text-[12.5px] text-ink-muted underline mt-3"
        >
          장바구니로 돌아가기
        </Link>
      </div>
    </main>
  );
}
