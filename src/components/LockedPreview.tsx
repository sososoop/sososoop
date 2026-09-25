'use client';

// 로그인·결제 게이트 뒤에 있는 앱(한글놀이·모의 CBT)의 공개 소개 화면.
// 비로그인/미결제 방문자에게 로그인 폼 대신 "무엇을 사는 건지" 보여주는 랜딩이다.
// 실제 앱 HTML은 여전히 게이트 뒤에 있고, 여기 쓰이는 건 캡처 이미지뿐.

import Link from 'next/link';
import { useState } from 'react';
import AddToCartButton from '@/components/AddToCartButton';
import type { CartItem } from '@/lib/cart';

export type PreviewShot = {
  src: string;
  label: string; // 썸네일 탭에 표시되는 짧은 이름
  caption: string; // 큰 이미지 아래 설명
};

export type PreviewFeature = {
  title: string;
  desc: string;
};

type Props = {
  eyebrow: string;
  title: string;
  tagline: string;
  intro: string;
  shots: PreviewShot[];
  features: PreviewFeature[];
  notes: string[];
  checkoutHref: string;
  /** [장바구니 담기]에 담을 상품. 없으면 버튼을 숨긴다. */
  cartItem?: CartItem | null;
  loginHref: string;
  /** anonymous = 비로그인, unpaid = 로그인했지만 이용권 없음 */
  state: 'anonymous' | 'unpaid';
};

export default function LockedPreview({
  eyebrow,
  title,
  tagline,
  intro,
  shots,
  features,
  notes,
  checkoutHref,
  cartItem,
  loginHref,
  state,
}: Props) {
  const [active, setActive] = useState(0);
  const shot = shots[active];

  return (
    <>
      {/* 헤더 — 무엇인지 + 잠김 상태를 한 화면에서 알린다 */}
      <section className="bg-tile-dark px-6 py-14">
        <div className="max-w-[1120px] mx-auto">
          <span className="block text-[12px] font-semibold text-primary-on-dark mb-3">
            {eyebrow}
          </span>
          <h1 className="text-[34px] md:text-[40px] font-semibold tracking-tight text-on-dark leading-tight mb-4">
            {title}
          </h1>
          <p className="text-[17px] text-on-dark/70 leading-[1.47] max-w-[680px] mb-6">
            {tagline}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={checkoutHref}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-[15px] font-semibold hover:bg-primary-dark transition-colors active:scale-95"
            >
              이용권 구매하기
            </Link>
            {cartItem && (
              <AddToCartButton
                item={cartItem}
                className="inline-flex items-center px-6 py-3 rounded-full border border-primary-on-dark/60 text-primary-on-dark text-[15px] font-semibold hover:bg-on-dark/10 transition-colors active:scale-95"
              />
            )}
            {state === 'anonymous' && (
              <Link
                href={loginHref}
                className="inline-flex items-center px-5 py-3 rounded-full border border-on-dark/25 text-on-dark/80 text-[15px] hover:bg-on-dark/10 transition-colors"
              >
                이미 구매했어요 · 로그인
              </Link>
            )}
          </div>
          <p className="mt-4 text-[13px] text-on-dark/50">
            🔒 이용권을 구매한 소소숲 회원만 이용할 수 있는 유료 서비스입니다.
          </p>
        </div>
      </section>

      {/* 미리보기 — 실제 화면 캡처 */}
      <section className="bg-parchment px-6 py-12">
        <div className="max-w-[1120px] mx-auto">
          <h2 className="text-[21px] font-semibold text-ink mb-2">미리 보기</h2>
          <p className="text-[15px] text-ink-muted leading-relaxed mb-6">{intro}</p>

          {/* 썸네일 탭 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {shots.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={i === active}
                className={`px-4 py-2 rounded-full text-[14px] font-medium transition-colors ${
                  i === active
                    ? 'bg-primary text-white'
                    : 'bg-canvas text-ink-muted border border-hairline hover:border-primary/40'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* 큰 이미지 + 잠김 표시.
              좁은 화면에서 축소하면 글씨가 안 보이므로, 이미지는 최소 너비를 유지하고
              페이지 대신 이 상자만 가로로 밀리게 한다. */}
          <div className="relative rounded-[18px] border border-hairline bg-canvas">
            <div className="overflow-x-auto rounded-[18px]">
              <img
                src={shot.src}
                alt={`${title} ${shot.label} 화면`}
                className="block w-full min-w-[680px] sm:min-w-0"
                loading="lazy"
              />
            </div>
            <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink/80 text-on-dark text-[12px] font-semibold backdrop-blur-sm">
              🔒 이용권 필요
            </span>
          </div>
          <p className="mt-3 text-[14px] text-ink-muted leading-relaxed">
            <span className="sm:hidden text-ink-light">← 옆으로 밀어서 볼 수 있어요 · </span>
            {shot.caption}
          </p>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="bg-canvas px-6 py-12">
        <div className="max-w-[1120px] mx-auto">
          <h2 className="text-[21px] font-semibold text-ink mb-6">이런 걸 할 수 있어요</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-pearl rounded-[18px] border border-hairline p-6"
              >
                <h3 className="text-[16px] font-semibold text-ink mb-2">{f.title}</h3>
                <p className="text-[14px] text-ink-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 이용 안내 + 마무리 CTA */}
      <section className="bg-parchment px-6 py-12">
        <div className="max-w-[1120px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
          <div className="bg-canvas rounded-[18px] border border-hairline p-8">
            <h2 className="text-[21px] font-semibold text-ink mb-5">이용 안내</h2>
            <ul className="flex flex-col gap-3">
              {notes.map((n) => (
                <li
                  key={n}
                  className="flex items-start gap-2.5 text-[15px] text-ink-muted leading-relaxed"
                >
                  <span className="text-primary mt-0.5">✓</span>
                  {n}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-canvas rounded-[18px] border border-hairline p-8 text-center lg:sticky lg:top-6">
            <p className="text-[16px] font-semibold text-ink mb-2">{title}</p>
            <p className="text-[14px] text-ink-muted leading-relaxed mb-6">
              {state === 'anonymous'
                ? '구매 후 소소숲 계정으로 로그인하면 이 페이지에서 바로 시작할 수 있어요.'
                : '이용권을 구매하면 이 페이지에서 바로 시작할 수 있어요.'}
            </p>
            <Link
              href={checkoutHref}
              className="block w-full px-6 py-3 rounded-full bg-primary text-white text-[15px] font-semibold hover:bg-primary-dark transition-colors active:scale-95"
            >
              이용권 구매하기
            </Link>
            {cartItem && (
              <AddToCartButton
                item={cartItem}
                className="block w-full mt-2.5 px-6 py-3 rounded-full border border-primary bg-white text-primary text-[15px] font-semibold hover:bg-primary/5 transition-colors active:scale-95"
              />
            )}
            <p className="mt-3 text-[12px] text-ink-light">이용기간: 결제일로부터 6개월</p>
            <Link
              href="/resources"
              className="inline-block mt-4 text-[13px] text-ink-muted underline hover:text-primary transition-colors"
            >
              자료실 둘러보기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
