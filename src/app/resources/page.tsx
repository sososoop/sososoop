import type { Metadata } from 'next';
import { paidResources } from '@/data/resources';
import { games as staticFree } from '@/data/games';
import { getGamesCached, getResourcesCached } from '@/lib/notion';
import { createClient } from '@/lib/supabase/server';
import ResourceTabs from '@/components/ResourceTabs';

export const metadata: Metadata = {
  title: '자료실',
  description:
    '수업에 바로 꺼내 쓰는 무료 학습게임·만들기 도구·GPT·PDF와 유료 자료. 대상·영역 키워드로 필요한 자료를 골라 쓰세요.',
};

// 무료 자료 목록은 누구나 보고, 링크·파일은 로그인한 회원에게만 내려 준다.
// 무료 자료는 Notion 「소소숲 무료 자료」 표, 유료 자료는 「소소숲 자료실」 표에서 읽는다(각 60초 캐시).
export const dynamic = 'force-dynamic';

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = !!user;
  const [notionFree, notionResources] = await Promise.all([getGamesCached(), getResourcesCached()]);

  const allFree = notionFree ?? staticFree;
  const free = loggedIn ? allFree : allFree.map((g) => ({ ...g, linkUrl: undefined, fileUrl: undefined }));

  // 유료 자료의 링크·파일 주소는 산 사람에게만(마이페이지) 보여 준다.
  const paid = (notionResources ? notionResources.filter((r) => r.type === 'paid') : paidResources).map(
    (r) => ({ ...r, linkUrl: undefined, fileUrl: undefined }),
  );

  return (
    <>
      <section className="relative overflow-hidden bg-parchment min-h-[320px] py-16 md:py-20 px-6">
        <img src="/images/resources-hero-library.png" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-white/70" />
        <div className="relative z-10 max-w-[1000px] mx-auto">
          <p className="text-[14px] font-semibold text-primary mb-2">자료실</p>
          <h1 className="text-[40px] font-semibold tracking-tight text-ink mb-4">
            소소숲 자료실
          </h1>
          <p className="text-[17px] text-ink-muted leading-[1.47]">
            수업에 바로 꺼내 쓰는 학습게임과 자료를 모았어요.
            <br className="hidden md:block" /> 대상·영역 키워드로 오늘 필요한 것을 골라 보세요.
          </p>
        </div>
      </section>

      <section className="bg-canvas py-12 px-6">
        <div className="max-w-[1000px] mx-auto">
          <ResourceTabs freeItems={free} paidResources={paid} loggedIn={loggedIn} initialTab={tab === 'paid' ? 'paid' : 'free'} />
        </div>
      </section>
    </>
  );
}
