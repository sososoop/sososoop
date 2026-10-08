'use client';

// 첫 화면 팝업 — 신청 중인 무료 LIVE를 알린다. '오늘 하루 보지 않기'를 누르면 다음 날까지 안 뜬다.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export type LivePopupItem = {
  slug: string;
  title: string;
  startsAt: string;
  dateLabel: string;
  timeLabel: string;
  place: string;
  summary: string;
};

const HIDE_KEY = (slug: string) => `sososoop-live-popup-hide:${slug}`;

function hiddenUntil(slug: string): number {
  try {
    return Number(localStorage.getItem(HIDE_KEY(slug)) ?? 0);
  } catch {
    return 0;
  }
}

export default function LivePopup({ lives }: { lives: LivePopupItem[] }) {
  const [live, setLive] = useState<LivePopupItem | null>(null);
  const cta = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const now = Date.now();
    const pick = lives.find((l) => now < new Date(l.startsAt).getTime() && hiddenUntil(l.slug) < now);
    if (!pick) return;
    // 첫 화면이 그려진 뒤 살짝 늦게 띄운다.
    const t = window.setTimeout(() => setLive(pick), 700);
    return () => window.clearTimeout(t);
  }, [lives]);

  useEffect(() => {
    if (!live) return;
    cta.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLive(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [live]);

  if (!live) return null;

  const hideToday = () => {
    const end = new Date();
    end.setHours(24, 0, 0, 0); // 오늘 자정까지
    try {
      localStorage.setItem(HIDE_KEY(live.slug), String(end.getTime()));
    } catch {
      // 저장이 막힌 브라우저면 이번에만 닫는다.
    }
    setLive(null);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 py-6"
      onClick={() => setLive(null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="live-popup-title"
        className="w-full max-w-[420px] max-h-full overflow-y-auto bg-cbt-paper border-2 border-cbt-ink shadow-[10px_10px_0_0_#12B5A5] text-cbt-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-b-2 border-cbt-ink cbt-grid">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/videos/cbt/live-${live.slug}.webp`}
            alt={`${live.dateLabel} ${live.timeLabel} 무료 LIVE — 달력과 시계`}
            width={1464}
            height={1208}
            className="block w-full h-auto px-5 pt-12"
          />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-cbt-ink text-white text-[12px] font-black tracking-[0.08em] px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-cbt-red animate-pulse" aria-hidden />
            무료 LIVE
          </span>
          <button
            type="button"
            onClick={() => setLive(null)}
            aria-label="닫기"
            className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center bg-white border-2 border-cbt-ink text-[18px] leading-none font-bold hover:bg-cbt-mint-soft"
          >
            ×
          </button>
        </div>
        <div className="px-6 pt-5 pb-6">
          <p className="text-[14px] font-bold text-[#4a4a46]">시험 전에 한번 같이 봐요</p>
          <h2 id="live-popup-title" className="mt-1 text-[22px] font-black leading-snug tracking-tight [word-break:keep-all]">
            {live.title}
          </h2>
          <p className="mt-2 text-[14px] font-semibold text-[#3a3a36] leading-relaxed [word-break:keep-all]">{live.summary}예요.</p>
          <p className="mt-3 inline-flex flex-wrap gap-1.5 text-[13px] font-extrabold">
            <span className="border-2 border-cbt-ink bg-white px-2 py-0.5">📅 {live.dateLabel} {live.timeLabel}</span>
            <span className="border-2 border-cbt-ink bg-white px-2 py-0.5">💻 {live.place}</span>
            <span className="border-2 border-cbt-ink bg-cbt-mint text-white px-2 py-0.5">무료</span>
          </p>
          <Link
            ref={cta}
            href={`/lectures/live/${live.slug}`}
            onClick={() => setLive(null)}
            className="mt-5 flex items-center justify-center py-3.5 border-2 border-cbt-ink bg-cbt-mint text-white text-[17px] font-black shadow-[4px_4px_0_0_#1a1a1a] hover:bg-cbt-mint-dark"
          >
            무료로 신청하기 →
          </Link>
          <div className="mt-4 flex justify-between text-[13px] text-cbt-gray">
            <button type="button" onClick={hideToday} className="underline hover:text-cbt-ink">
              오늘 하루 보지 않기
            </button>
            <button type="button" onClick={() => setLive(null)} className="hover:text-cbt-ink">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
