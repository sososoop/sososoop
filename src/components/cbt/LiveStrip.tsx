// 모의 CBT 화면에 붙이는 '신청 중인 무료 LIVE' 안내(띠·버튼). 신청 기간이 끝나면 저절로 사라진다.
import Link from 'next/link';
import { FREE_LIVES, isLiveOpen } from '@/data/freeLives';

function openLive() {
  return FREE_LIVES.find((l) => isLiveOpen(l)) ?? null;
}

// 표지 맨 위 한 줄 띠
export function LiveStrip() {
  const live = openLive();
  if (!live) return null;
  return (
    <Link
      href={`/lectures/live/${live.slug}`}
      className="group mb-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-2 border-cbt-ink bg-white px-4 py-2.5 shadow-[4px_4px_0_0_#1a1a1a] hover:bg-cbt-mint-soft transition-colors"
    >
      <span className="inline-flex items-center gap-1.5 bg-cbt-ink text-white text-[12px] font-black tracking-[0.08em] px-2 py-1">
        <span className="w-2 h-2 rounded-full bg-cbt-red animate-pulse" aria-hidden />
        무료 LIVE
      </span>
      <span className="text-[14.5px] font-extrabold [word-break:keep-all]">
        {live.title.replace(/^언어재활사 /, '')} · {live.dateLabel.replace(/^\d{4}년 /, '')} {live.timeLabel}
      </span>
      <span className="ml-auto text-[14px] font-black text-cbt-pop group-hover:underline whitespace-nowrap">신청하기 →</span>
    </Link>
  );
}

// 무료 체험 버튼 옆에 두는 버튼
export function LiveButton({ className }: { className: string }) {
  const live = openLive();
  if (!live) return null;
  return (
    <Link href={`/lectures/live/${live.slug}`} className={className}>
      <span className="w-2.5 h-2.5 rounded-full bg-cbt-red mr-2 animate-pulse" aria-hidden />
      무료 LIVE 신청하기
    </Link>
  );
}
