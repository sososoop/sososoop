// /slp-cbt-practice 의 공개 소개 화면(비로그인·미결제·기간 끝남).
// 예전 LockedPreview 자리 — 위는 표지(히어로), 가운데는 상세 섹션, 아래는 이용 안내와 구매 카드.

import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';
import type { CartItem } from '@/lib/cart';
import CbtDetailSections, { CBT_TRIAL_URL, CLIPS, daysToExam } from './CbtDetail';
import AutoVideo from './AutoVideo';

type Props = {
  state: 'anonymous' | 'unpaid' | 'expired';
  expiredOn?: string;
  periodLabel: string;
  perk: string;
  notes: string[];
  checkoutHref: string;
  cartItem?: CartItem | null;
  loginHref: string;
};

const BTN = 'inline-flex items-center justify-center px-6 py-3 border-2 border-cbt-ink text-[16px] font-black transition-colors active:translate-x-[2px] active:translate-y-[2px]';

export default function CbtLanding({ state, expiredOn, periodLabel, perk, notes, checkoutHref, cartItem, loginHref }: Props) {
  const dday = daysToExam();
  const price = cartItem?.price ? `${cartItem.price.toLocaleString()}원` : null;
  return (
    <div className="text-cbt-ink">
      {/* 표지 */}
      <section className="cbt-grid px-6 pt-12 pb-14 md:pt-16 md:pb-20 border-b-2 border-cbt-ink">
        <div className="max-w-[1120px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-10 lg:gap-14 items-center">
          <div>
            {dday !== null && (
              <p className="flex items-center gap-3 text-[18px] md:text-[20px] font-extrabold">
                언어재활사 국가시험
                <span className="bg-cbt-red text-white border-2 border-cbt-ink px-3 py-0.5 text-[22px] md:text-[24px] font-black tabular-nums">
                  {dday === 0 ? 'D-DAY' : `D-${dday}`}
                </span>
              </p>
            )}
            <h1 className="mt-5 tracking-tight [word-break:keep-all]">
              <span className="block text-[26px] md:text-[32px] font-extrabold">시험 당일 처음 보는 CBT,</span>
              <span className="block mt-1 text-[44px] md:text-[60px] font-black leading-[1.1]">
                <span className="text-cbt-pop">미리</span> 연습하세요.
              </span>
            </h1>
            <p className="mt-6 text-[24px] md:text-[28px] font-black tracking-tight">
              언어재활사 모의 CBT
              <span className="ml-2 align-middle text-[14px] font-bold text-cbt-gray">1급 3회분 · 2급 2회분 · 총 720문항</span>
            </p>
            <p className="mt-3 inline-flex flex-wrap border-2 border-cbt-ink bg-white text-[15px] md:text-[16px] font-extrabold">
              <span className="bg-cbt-pop text-white px-3 py-1.5 border-r-2 border-cbt-ink">제14회 국가시험 차석 합격자</span>
              <span className="px-3 py-1.5">직접 개발</span>
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={checkoutHref} className={`${BTN} bg-cbt-pop text-white hover:bg-[#2f49b0]`}>
                이용권 구매하기{price ? ` · ${price}` : ''}
              </Link>
              {cartItem && <AddToCartButton item={cartItem} className={`${BTN} bg-white hover:bg-cbt-mint-soft`} />}
              <span className="inline-flex items-center gap-2.5">
                <a href={CBT_TRIAL_URL} target="_blank" rel="noopener noreferrer" className={`${BTN} bg-cbt-mint text-white hover:bg-cbt-mint-dark`}>
                  20문항 무료 체험 →
                </a>
                <span className="text-[13px] font-bold text-cbt-gray whitespace-nowrap">1급 문항 기준</span>
              </span>
            </div>
            {state === 'anonymous' && (
              <Link href={loginHref} className="inline-block mt-4 text-[14px] font-bold text-cbt-gray underline hover:text-cbt-pop">
                이미 구매했어요 · 로그인
              </Link>
            )}
            {state === 'expired' ? (
              <p className="mt-4 text-[14px] font-bold text-cbt-red">
                ⏰ 이용기간이 {expiredOn}에 끝났어요. 이용권을 다시 구매하면 바로 이어서 이용할 수 있어요.
              </p>
            ) : (
              <p className="mt-4 text-[13px] text-cbt-gray">🔒 이용권을 구매한 소소숲 회원만 이용할 수 있는 유료 서비스입니다 · 이용기간 {periodLabel}</p>
            )}
            <p className="mt-1 text-[13px] text-cbt-gray">{perk}</p>
          </div>
          <div>
            <AutoVideo name={CLIPS.hero.name} width={CLIPS.hero.w} height={CLIPS.hero.h} alt="언어재활사 모의 CBT 시험 화면" />
          </div>
        </div>
      </section>

      <CbtDetailSections
        checkoutHref={checkoutHref}
        price={cartItem?.price}
        extraCta={cartItem ? <AddToCartButton item={cartItem} className={`${BTN} px-7 py-3.5 text-[17px] bg-white hover:bg-cbt-mint-soft`} /> : null}
      />

      {/* 이용 안내 + 구매 카드 */}
      <section className="bg-parchment px-6 py-12 border-t-2 border-cbt-ink">
        <div className="max-w-[1120px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
          <div className="bg-white border-2 border-cbt-ink p-8">
            <h2 className="text-[21px] font-black mb-5">이용 안내</h2>
            <ul className="flex flex-col gap-3">
              {notes.map((n) => (
                <li key={n} className="flex items-start gap-2.5 text-[15px] text-ink-muted leading-relaxed">
                  <span className="text-cbt-mint-dark font-black mt-0.5">✓</span>
                  {n}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border-2 border-cbt-ink p-8 text-center lg:sticky lg:top-6 shadow-[8px_8px_0_0_#12B5A5]">
            <p className="text-[16px] font-black mb-1">언어재활사 모의 CBT 이용권</p>
            {price && <p className="text-[32px] font-black tracking-tight mb-2">{price}</p>}
            <p className="text-[14px] text-ink-muted leading-relaxed mb-6">
              {state === 'anonymous'
                ? '구매 후 소소숲 계정으로 로그인하면 이 페이지에서 바로 시작할 수 있어요.'
                : state === 'expired'
                  ? `이용기간이 ${expiredOn}에 끝났어요. 다시 구매하면 이 페이지에서 바로 이어서 쓸 수 있어요.`
                  : '이용권을 구매하면 이 페이지에서 바로 시작할 수 있어요.'}
            </p>
            <Link href={checkoutHref} className={`${BTN} w-full bg-cbt-pop text-white hover:bg-[#2f49b0]`}>
              이용권 구매하기
            </Link>
            {cartItem && <AddToCartButton item={cartItem} className={`${BTN} w-full mt-2.5 bg-white hover:bg-cbt-mint-soft`} />}
            <p className="mt-3 text-[12px] text-ink-light">이용기간: {periodLabel}</p>
            <a href={CBT_TRIAL_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-[13px] font-bold text-cbt-mint-dark underline">
              먼저 20문항 무료 체험하기 →
            </a>
            <span className="block mt-1 text-[12px] text-cbt-gray">1급 문항 기준</span>
          </div>
        </div>
      </section>
    </div>
  );
}
