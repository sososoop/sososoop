import type { Metadata } from 'next';
import Link from 'next/link';
import { games as staticGames } from '@/data/games';
import { getGamesCached } from '@/lib/notion';
import { createClient } from '@/lib/supabase/server';
import GameBrowser from '@/components/GameBrowser';

export const metadata: Metadata = {
  title: '무료 학습게임',
  description:
    '언어치료·한글·어휘 수업에 바로 쓰는 무료 학습게임 모음. 대상·영역·난이도 키워드로 필요한 활동을 골라 쓰세요.',
};

// 목록은 누구나 보고, 게임 링크는 로그인한 회원에게만 내려 준다.
export const dynamic = 'force-dynamic';

const tabClass = (active: boolean) =>
  `px-4 md:px-6 py-2.5 md:py-3 rounded-full text-[14px] md:text-[15px] font-semibold transition-colors ${
    active
      ? 'bg-primary text-white'
      : 'bg-canvas border border-hairline text-ink-muted hover:border-primary/40 hover:text-ink'
  }`;

export default async function GamesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = !!user;

  const all = (await getGamesCached()) ?? staticGames;
  // 비로그인 방문자에게는 게임 주소를 HTML에 싣지 않는다.
  const games = loggedIn ? all : all.map((g) => ({ ...g, linkUrl: undefined }));

  return (
    <>
      <section className="relative overflow-hidden bg-parchment min-h-[320px] py-16 md:py-20 px-6">
        <img src="/images/resources-hero-library.png" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-white/70" />
        <div className="relative z-10 max-w-[1000px] mx-auto">
          <p className="text-[14px] font-semibold text-primary mb-2">자료실</p>
          <h1 className="text-[40px] font-semibold tracking-tight text-ink mb-4">무료 학습게임</h1>
          <p className="text-[17px] text-ink-muted leading-[1.47]">
            수업에 바로 꺼내 쓰는 학습게임과 만들기 도구를 모았어요.
            <br className="hidden md:block" /> 대상·영역 키워드로 오늘 필요한 활동을 골라 보세요.
          </p>
        </div>
      </section>

      <section className="bg-canvas py-12 px-6">
        <div className="max-w-[1000px] mx-auto">
          <nav className="flex flex-wrap gap-2 md:gap-3 mb-10" aria-label="자료실 구분">
            <Link href="/resources" className={tabClass(false)}>
              무료 자료
            </Link>
            <Link href="/resources?tab=paid" className={tabClass(false)}>
              유료 자료
            </Link>
            <span className={tabClass(true)} aria-current="page">
              무료 학습게임
            </span>
          </nav>
          <GameBrowser games={games} loggedIn={loggedIn} />
        </div>
      </section>
    </>
  );
}
