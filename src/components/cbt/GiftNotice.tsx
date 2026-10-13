'use client';

// 모의 CBT 이용권 구매자에게 한 번 띄우는 '구매 선물 추가' 공지.
// 이용권이 있는 화면(CBT 앱 입구·마이페이지)에서만 렌더한다. 닫으면 이 브라우저에서는 다시 안 뜬다.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const NOTICE_ID = 'gift-notes-1014';
const SHOW_UNTIL = new Date('2026-10-31T23:59:59+09:00').getTime();
const KEY = `sososoop-notice-seen:${NOTICE_ID}`;

function seen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export default function GiftNotice({ delay = 600 }: { delay?: number }) {
  const [open, setOpen] = useState(false);
  const cta = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (Date.now() > SHOW_UNTIL || seen()) return;
    const t = window.setTimeout(() => setOpen(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!open) return;
    cta.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function close() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // 저장이 막힌 브라우저면 이번에만 닫는다.
    }
    setOpen(false);
  }

  if (!open) return null;

  const notes = ['신경언어장애', '음성장애', '삼킴장애'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 py-6" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-notice-title"
        className="relative w-full max-w-[420px] max-h-full overflow-y-auto bg-cbt-paper border-2 border-cbt-ink shadow-[10px_10px_0_0_#12B5A5] text-cbt-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="닫기"
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center bg-white border-2 border-cbt-ink text-[18px] leading-none font-bold hover:bg-cbt-mint-soft"
        >
          ×
        </button>
        <div className="px-6 pt-6 pb-6">
          <span className="inline-flex items-center gap-1.5 bg-cbt-ink text-white text-[12px] font-black tracking-[0.08em] px-2.5 py-1">
            🎁 구매 선물 추가
          </span>
          <h2 id="gift-notice-title" className="mt-4 text-[22px] font-black leading-snug tracking-tight [word-break:keep-all]">
            국시 준비하며 정리한
            <br />
            <span className="text-cbt-pop">필기 PDF</span>를 함께 드려요
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {notes.map((n) => (
              <li key={n} className="flex items-center gap-2.5 bg-white border-2 border-cbt-ink px-3.5 py-2.5 text-[15px] font-bold">
                <span className="w-6 h-6 shrink-0 bg-cbt-mint border-2 border-cbt-ink text-white text-[12px] font-black flex items-center justify-center" aria-hidden>
                  ✓
                </span>
                {n} 필기
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[14px] font-semibold text-[#3a3a36] leading-relaxed [word-break:keep-all]">
            기존 기출유형분석 심화판과 함께 마이페이지 <strong>구매내역</strong>에서 받을 수 있어요. 이용기간 동안 언제든 다시 받을 수 있어요.
          </p>
          <Link
            ref={cta}
            href="/mypage#orders"
            onClick={close}
            className="mt-5 flex items-center justify-center py-3.5 border-2 border-cbt-ink bg-cbt-mint text-white text-[17px] font-black shadow-[4px_4px_0_0_#1a1a1a] hover:bg-cbt-mint-dark"
          >
            마이페이지에서 받기 →
          </Link>
          <p className="mt-3 text-center text-[12.5px] text-cbt-gray">휴대폰에서도 받을 수 있어요 · 구매한 계정으로 로그인</p>
        </div>
      </div>
    </div>
  );
}
