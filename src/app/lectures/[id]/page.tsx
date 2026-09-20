import type { Metadata } from 'next';
import { lectures as staticLectures } from '@/data/lectures';
import { lectureDetails } from '@/data/lectureDetails';
import { lectureReviews } from '@/data/reviews';
import { getLectures } from '@/lib/notion';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PurchaseBox from '@/components/PurchaseBox';
import { SERVICE_PERIOD_LABEL } from '@/lib/period';

export const revalidate = 60;

export async function generateStaticParams() {
  return staticLectures.map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lecture =
    staticLectures.find((l) => l.id === id) ??
    (await getLectures())?.find((l) => l.id === id);

  if (!lecture) return {};

  return {
    title: lecture.title,
    description: lecture.description,
  };
}

export default async function LectureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const notionLectures = await getLectures();
  const lectures = notionLectures ?? staticLectures;
  const lecture = lectures.find((l) => l.id === id);

  if (!lecture) notFound();

  const detail = lectureDetails[lecture.id];
  const reviews = lectureReviews[lecture.id] ?? [];

  return (
    <>
      {/* 강의 헤더 */}
      <section className={`relative overflow-hidden py-16 px-6 ${lecture.image ? '' : 'bg-tile-dark'}`}>
        {lecture.image && (
          <>
            <img
              src={lecture.image}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
          </>
        )}
        <div className="relative z-10 max-w-[1120px] mx-auto">
          <Link
            href="/lectures"
            className="inline-flex items-center gap-1 text-[14px] text-on-dark/50 hover:text-on-dark/80 transition-colors mb-6"
          >
            ← 강의 목록으로
          </Link>
          <span className="block text-[12px] font-semibold text-primary-on-dark mb-3">
            {lecture.category}
          </span>
          <h1 className="text-[34px] md:text-[40px] font-semibold tracking-tight text-on-dark mb-4 leading-tight max-w-[720px]">
            {lecture.title}
          </h1>
          <p className="text-[17px] text-on-dark/70 leading-[1.47] mb-6 max-w-[720px]">
            {lecture.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[14px] text-on-dark/60">
            <span>{lecture.duration}</span>
            <span className="text-on-dark/30">·</span>
            <span>언어재활사 이승윤</span>
          </div>
          <a
            href="#apply"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-primary text-white text-[15px] font-medium hover:bg-primary-dark transition-colors active:scale-95 lg:hidden"
          >
            결제하기 ↓
          </a>
        </div>
      </section>

      {/* 본문: 강의 상세(좌) + 신청 박스(우) */}
      <section className="bg-parchment py-12 px-6">
        <div className="max-w-[1120px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
          {/* 왼쪽: 강의 상세 */}
          {detail && (
            <div className="flex flex-col gap-8 min-w-0">
              {/* 소개 */}
              <p className="text-[17px] text-ink leading-[1.7]">{detail.intro}</p>

              {/* 이런 분께 추천 */}
              <div className="bg-canvas rounded-[18px] p-8 border border-hairline">
                <h2 className="text-[21px] font-semibold text-ink mb-5">
                  이런 분께 추천해요
                </h2>
                <ul className="flex flex-col gap-3">
                  {detail.audience.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[15px] text-ink-muted leading-relaxed"
                    >
                      <span className="text-primary mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 커리큘럼 */}
              <div className="bg-canvas rounded-[18px] p-8 border border-hairline">
                <h2 className="text-[21px] font-semibold text-ink mb-6">커리큘럼</h2>
                <div className="flex flex-col gap-6">
                  {detail.curriculum.map((section) => (
                    <div key={section.part}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="shrink-0 px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-semibold">
                          {section.part}
                        </span>
                        <h3 className="text-[17px] font-semibold text-ink">
                          {section.title}
                        </h3>
                      </div>
                      <ul className="flex flex-col gap-2 pl-1">
                        {section.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 text-[14px] text-ink-muted leading-relaxed"
                          >
                            <span className="text-primary/60 mt-0.5">·</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* 전체 제작 흐름 */}
              {detail.flow && (
                <div className="bg-canvas rounded-[18px] p-8 border border-hairline">
                  <h2 className="text-[21px] font-semibold text-ink mb-2">
                    전체 제작 흐름
                  </h2>
                  <p className="text-[14px] text-ink-light mb-5">
                    기획부터 출간까지, 이 순서대로 완성합니다.
                  </p>
                  <div className="flex flex-col">
                    {detail.flow.map((row, i) => (
                      <div
                        key={row.step}
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3 ${
                          i > 0 ? 'border-t border-hairline' : ''
                        }`}
                      >
                        <span className="text-[14px] text-ink font-medium">
                          {row.step}
                        </span>
                        <span className="text-[13px] text-ink-light">{row.tool}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 포함 혜택 + 준비물 */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-canvas rounded-[18px] p-8 border border-hairline">
                  <h2 className="text-[21px] font-semibold text-ink mb-5">
                    포함된 혜택
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {detail.includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[14px] text-ink-muted leading-relaxed"
                      >
                        <span className="text-primary mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-canvas rounded-[18px] p-8 border border-hairline">
                  <h2 className="text-[21px] font-semibold text-ink mb-5">
                    수강 전 준비물
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {detail.requirements.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[14px] text-ink-muted leading-relaxed"
                      >
                        <span className="text-primary mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-canvas rounded-[18px] p-8 border border-hairline">
                <h2 className="text-[21px] font-semibold text-ink mb-6">
                  자주 묻는 질문
                </h2>
                <div className="flex flex-col gap-5">
                  {detail.faq.map((item) => (
                    <div key={item.q}>
                      <p className="text-[15px] font-semibold text-ink mb-1.5">
                        Q. {item.q}
                      </p>
                      <p className="text-[14px] text-ink-muted leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 수강 후기 */}
              {reviews.length > 0 && (
                <div className="bg-canvas rounded-[18px] p-8 border border-hairline">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-[21px] font-semibold text-ink">수강 후기</h2>
                    <span className="text-primary text-[15px]">★★★★★</span>
                  </div>
                  <p className="text-[14px] text-ink-light mb-6">
                    실제로 강의를 듣고 남겨주신 후기예요.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {reviews.map((review, i) => (
                      <figure
                        key={i}
                        className="flex flex-col bg-parchment rounded-[14px] p-5 border border-hairline"
                      >
                        <span className="text-primary/40 text-[28px] leading-none font-serif mb-1">
                          &ldquo;
                        </span>
                        <blockquote className="text-[14px] text-ink-muted leading-[1.65] flex-1">
                          {review.text}
                        </blockquote>
                        <figcaption className="mt-4 text-[13px] font-semibold text-ink">
                          {review.author ?? '수강생'}
                          {review.role && (
                            <span className="ml-1.5 font-normal text-ink-light">
                              · {review.role}
                            </span>
                          )}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 오른쪽: 결제 박스 (데스크톱에서 스크롤 고정) */}
          <PurchaseBox
            productId={lecture.id}
            title={lecture.title}
            price={lecture.price}
            image={lecture.image}
            badge="모집중"
            note={`수강기간(녹화본·자료 이용): ${SERVICE_PERIOD_LABEL} · 토스페이먼츠 안전결제`}
          />
        </div>
      </section>
    </>
  );
}
