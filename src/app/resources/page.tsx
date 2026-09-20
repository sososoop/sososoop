import type { Metadata } from 'next';
import { freeResources, paidResources } from '@/data/resources';
import { getResourcesCached } from '@/lib/notion';
import { createClient } from '@/lib/supabase/server';
import ResourceTabs from '@/components/ResourceTabs';

export const metadata: Metadata = {
  title: '자료실',
  description:
    '임상 현장에서 바로 쓸 수 있는 무료·유료 자료를 제공합니다. AI 프롬프트 모음, 학습 자료 제작 GPT 등.',
};

// 무료 자료도 로그인한 회원에게만 열어주므로 요청마다 세션을 확인한다.
// (Notion 조회는 getResourcesCached가 60초 캐시)
export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const notionResources = await getResourcesCached();

  const free = notionResources
    ? notionResources.filter((r) => r.type === 'free')
    : freeResources;

  const paid = notionResources
    ? notionResources.filter((r) => r.type === 'paid')
    : paidResources;

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
            임상 현장에서 바로 쓸 수 있는 자료를 제공합니다.
          </p>
        </div>
      </section>

      <section className="bg-canvas py-12 px-6">
        <div className="max-w-[1000px] mx-auto">
          <ResourceTabs freeResources={free} paidResources={paid} loggedIn={!!user} />
        </div>
      </section>
    </>
  );
}
