import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { freeResources, paidResources, type Resource } from '@/data/resources';
import { getResourcesCached } from '@/lib/notion';
import { createClient } from '@/lib/supabase/server';
import BuyButtons from '@/components/BuyButtons';

// 무료 자료도 로그인 회원에게만 열어주므로 요청마다 세션을 확인한다.
// (Notion 조회는 getResourcesCached가 60초 캐시)
export const dynamic = 'force-dynamic';

const staticAll = [...freeResources, ...paidResources];

async function loadAll(): Promise<Resource[]> {
  return (await getResourcesCached()) ?? staticAll;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const resource = (await loadAll()).find((r) => r.id === id);
  if (!resource) return {};
  return { title: resource.title, description: resource.description };
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = (await loadAll()).find((r) => r.id === id);

  if (!resource) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loginHref = `/login?next=${encodeURIComponent(`/resources/${id}`)}`;

  const isPaid = resource.type === 'paid' && typeof resource.price === 'number' && resource.price > 0;

  return (
    <main className="bg-canvas py-10 px-6 min-h-[70vh]">
      <div className="max-w-[1100px] mx-auto">
        <Link
          href="/resources"
          className="inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink transition-colors mb-6"
        >
          ← 자료실로
        </Link>

        {/* 상품 상단: 이미지(좌) + 정보·구매(우) */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* 이미지 */}
          <div className="w-full aspect-square rounded-[18px] overflow-hidden bg-stone-100 border border-hairline flex items-center justify-center">
            {resource.image ? (
              <img src={resource.image} alt={resource.title} className="w-full h-full object-cover" />
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-stone-300" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            )}
          </div>

          {/* 정보 + 구매 */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              {resource.category && (
                <span className="text-[12px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {resource.category}
                </span>
              )}
              {resource.fileType && (
                <span className="text-[12px] text-ink-light bg-hairline px-2 py-1 rounded">
                  {resource.fileType}
                </span>
              )}
            </div>

            <h1 className="text-[26px] md:text-[28px] font-bold text-ink leading-tight mb-4">
              {resource.title}
            </h1>

            {isPaid ? (
              <span className="text-[28px] font-bold text-ink mb-6">
                {(resource.price as number).toLocaleString()}원
              </span>
            ) : (
              <span className="text-[20px] font-bold text-primary mb-6">무료</span>
            )}

            <div className="bg-pearl border border-hairline rounded-[16px] p-6">
              {isPaid && (
                <div className="flex items-center justify-between mb-5 pb-5 border-b border-hairline">
                  <span className="text-[13px] text-ink-muted">총 상품금액 (1개)</span>
                  <span className="text-[22px] font-bold text-ink">
                    {(resource.price as number).toLocaleString()}원
                  </span>
                </div>
              )}

              {isPaid ? (
                <BuyButtons
                  id={resource.id}
                  title={resource.title}
                  price={resource.price as number}
                  image={resource.image}
                />
              ) : !user ? (
                <Link
                  href={loginHref}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-primary text-white text-[16px] font-semibold hover:bg-primary-dark transition-colors active:scale-[0.99]"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 1110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {resource.linkUrl ? '로그인하고 무료로 이용하기' : '로그인하고 무료로 받기'}
                </Link>
              ) : resource.linkUrl ? (
                <a
                  href={resource.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-primary text-white text-[16px] font-semibold hover:bg-primary-dark transition-colors active:scale-[0.99]"
                >
                  {resource.fileType} 사용하러 가기
                </a>
              ) : (
                <a
                  href={resource.fileUrl}
                  download={resource.downloadName ?? ''}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-primary text-white text-[16px] font-semibold hover:bg-primary-dark transition-colors active:scale-[0.99]"
                >
                  무료 다운로드
                </a>
              )}

              <p className="text-[12px] text-ink-light text-center mt-3 leading-relaxed">
                {isPaid
                  ? '이용기간: 결제일로부터 6개월 · 토스페이먼츠 안전결제'
                  : user
                    ? '소소숲 회원에게 무료로 제공되는 자료입니다.'
                    : '로그인하면 무료로 받을 수 있어요. 구글·카카오 계정으로 바로 로그인할 수 있습니다.'}
              </p>
            </div>
          </div>
        </div>

        {/* 상세정보 */}
        <div className="mt-12">
          <div className="border-b-2 border-ink/80 inline-block pb-2 mb-6">
            <span className="text-[15px] font-bold text-ink">상세정보</span>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-pearl rounded-[18px] p-8 border border-hairline">
              <h2 className="text-[19px] font-semibold text-ink mb-4">자료 소개</h2>
              <p className="text-[15.5px] text-ink leading-[1.8] whitespace-pre-line">
                {resource.description}
              </p>
            </div>

            {isPaid && (
              <div className="bg-pearl rounded-[18px] p-8 border border-hairline">
                <h2 className="text-[19px] font-semibold text-ink mb-4">이용 안내</h2>
                <ul className="flex flex-col gap-3 text-[15px] text-ink-muted leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-0.5">✓</span>
                    결제 완료 후 자료실에서 바로 이용하거나 안내에 따라 받아보실 수 있어요.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-0.5">✓</span>
                    이용기간은 결제일로부터 6개월입니다.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-0.5">✓</span>
                    카드·간편결제·계좌이체로 결제할 수 있어요 (토스페이먼츠).
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-0.5">✓</span>
                    이용 중 궁금한 점은 카카오채널로 문의해주세요.
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
