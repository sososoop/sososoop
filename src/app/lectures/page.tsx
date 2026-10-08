import type { Metadata } from 'next';
import Link from 'next/link';
import { lectures as staticLectures } from '@/data/lectures';
import { getLectures } from '@/lib/notion';
import { FREE_LIVES, isLiveOpen } from '@/data/freeLives';

export const metadata: Metadata = {
  title: '강의 목록',
  description:
    '언어재활사와 교육 전문가를 위한 실전 강의 — AI 활용, 평가보고서 작성, 책 출판, 콘텐츠 제작.',
};

export const revalidate = 60;

export default async function LecturesPage() {
  const notionLectures = await getLectures();
  const lectures = notionLectures ?? staticLectures;
  const openLives = FREE_LIVES.filter((l) => isLiveOpen(l));

  return (
    <>
      <section className="relative overflow-hidden bg-tile-dark min-h-[320px] py-16 md:py-20 px-6">
        <img src="/images/lectures-hero-online-class.png" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 max-w-[1000px] mx-auto">
          <p className="text-[14px] font-semibold text-primary-on-dark mb-2">온라인 강의</p>
          <h1 className="text-[40px] font-semibold tracking-tight text-white mb-4">강의 목록</h1>
          <p className="text-[17px] text-white/70 leading-[1.47]">
            언어재활사와 교육 전문가를 위한 실전 강의입니다.
          </p>
        </div>
      </section>

      <section className="bg-canvas py-12 px-6">
        <div className="max-w-[1000px] mx-auto">
          {/* 신청 중인 무료 LIVE */}
          {openLives.map((live) => (
            <Link
              key={live.slug}
              href={`/lectures/live/${live.slug}`}
              className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 rounded-[18px] border-2 border-cbt-ink bg-cbt-paper p-6 shadow-[8px_8px_0_0_#12B5A5] hover:-translate-y-0.5 transition-transform group"
            >
              <span className="inline-flex items-center gap-2 self-start bg-cbt-ink text-white text-[13px] font-black tracking-[0.08em] px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-cbt-red animate-pulse" aria-hidden />
                무료 LIVE
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[19px] font-black text-cbt-ink leading-snug">{live.title}</p>
                <p className="mt-1 text-[14px] text-ink-muted">
                  {live.dateLabel} {live.timeLabel} · {live.place} · 참가비 무료
                </p>
              </div>
              <span className="text-[15px] font-bold text-cbt-pop whitespace-nowrap group-hover:underline">무료 신청하기 →</span>
            </Link>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lectures.map((lecture) => (
              <Link
                key={lecture.id}
                href={`/lectures/${lecture.id}`}
                className="block bg-pearl rounded-[18px] overflow-hidden border border-hairline hover:border-warm-tan/60 hover:shadow-sm transition-all group"
              >
                {/* 썸네일 */}
                <div className="w-full h-48 overflow-hidden bg-stone-100 flex items-center justify-center">
                  {lecture.image ? (
                    <img src={lecture.image} alt={lecture.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-stone-300" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  )}
                </div>
                <div className="p-6">
                  <span className="inline-block text-[12px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
                    {lecture.category}
                  </span>
                  <h2 className="text-[19px] font-semibold text-ink mb-3 leading-snug group-hover:text-primary transition-colors">
                    {lecture.title}
                  </h2>
                  <p className="text-[14px] text-ink-muted leading-relaxed mb-5 line-clamp-3">
                    {lecture.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[19px] font-semibold text-ink">
                        {lecture.price.toLocaleString()}원
                      </p>
                      <p className="text-[13px] text-ink-light">{lecture.duration}</p>
                    </div>
                    <span className="text-[14px] text-primary font-medium group-hover:underline">
                      자세히 보기 →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
