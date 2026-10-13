import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMySurveyResponse } from '@/lib/surveys';
import { getSurvey } from '@/data/surveys';
import SurveyForm from './SurveyForm';

// 로그인·응답 여부에 따라 화면이 달라지므로 매번 새로 그린다.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const survey = getSurvey((await params).slug);
  if (!survey) return {};
  const description = '오프라인 CBT 실전 모의훈련 일정·장소를 정하기 위한 설문이에요. 확정 신청이 아니니 부담 없이 남겨주세요.';
  return {
    title: survey.title,
    description,
    robots: { index: false, follow: false },
    openGraph: { type: 'website', locale: 'ko_KR', siteName: '소소숲:지혜의 기록소', url: `/survey/${survey.slug}`, title: survey.title, description },
  };
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex border-2 border-cbt-ink bg-white text-[14px] font-extrabold">
      <span className="bg-cbt-mint text-white px-3 py-1 border-r-2 border-cbt-ink">모의 CBT</span>
      <span className="px-3 py-1">{children}</span>
    </span>
  );
}

export default async function SurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { slug } = await params;
  const survey = getSurvey(slug);
  if (!survey) notFound();
  const editing = (await searchParams).edit === '1';
  // 로컬 미리보기(npm run dev)에서는 로그인 없이도 ?edit=1 로 응답서 모양을 볼 수 있게 한다(저장은 서버가 막음).
  const preview = process.env.NODE_ENV === 'development' && editing;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const response = user ? await getMySurveyResponse(survey.slug, user.id) : null;
  const meta = user?.user_metadata ?? {};
  const defaultName = String(meta.name || meta.full_name || meta.nickname || '');
  const here = `/survey/${survey.slug}`;

  return (
    <div className="cbt-grid text-cbt-ink">
      {/* 안내문 */}
      <section className="px-6 pt-10 pb-10 md:pt-14 md:pb-14">
        <div className="max-w-[760px] mx-auto">
          <div className="flex flex-wrap items-center gap-3">
            <Chip>오프라인 모의훈련</Chip>
            <span className="inline-flex items-center bg-cbt-ink text-white text-[14px] font-black tracking-[0.04em] px-3 py-1.5">관심자 설문</span>
          </div>
          <h1 className="mt-6 tracking-tight">
            <span className="block text-[20px] md:text-[24px] font-bold text-[#4a4a46]">{survey.kicker}</span>
            <span className="block mt-1 text-[32px] md:text-[46px] font-black leading-[1.18] [word-break:keep-all]">
              소수정예 <span className="text-cbt-pop">오프라인 CBT</span>
              <br />
              실전 모의훈련 관심자 조사
            </span>
          </h1>

          <div className="mt-7 flex flex-col gap-4 text-[16px] md:text-[17px] font-semibold text-[#3a3a36] leading-relaxed [word-break:keep-all]">
            <p>{survey.intro[0]}</p>
            <p>{survey.intro[1]}</p>
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {survey.points.map((pt) => (
                <li key={pt} className="flex items-center gap-3 bg-white border-2 border-cbt-ink px-4 py-3 text-cbt-ink">
                  <span className="w-7 h-7 shrink-0 bg-cbt-mint border-2 border-cbt-ink text-white text-[14px] font-black flex items-center justify-center" aria-hidden>✓</span>
                  <span className="text-[15.5px] font-bold">{pt}</span>
                </li>
              ))}
            </ul>
            <p>{survey.closing[0]}</p>
            <p>
              한 분 한 분 직접 봐드리기 위해 <span className="cbt-mark font-black text-cbt-ink">6명 정도의 소수정예</span>로 생각하고 있어요.
            </p>
            <p>{survey.closing[2]}</p>
          </div>
          <p className="mt-6 inline-block bg-[#0d0d0c] text-white px-4 py-2.5 text-[15px] font-bold [word-break:keep-all]">※ {survey.notice}</p>
        </div>
      </section>

      {/* 설문 */}
      <section id="form" className="px-6 pb-16 md:pb-24 scroll-mt-20">
        <div className="max-w-[760px] mx-auto">
          <div className="bg-white border-2 border-cbt-ink p-6 md:p-8 shadow-[12px_12px_0_0_#12B5A5]">
            {response && !editing ? (
              <div className="text-center py-4">
                <p className="text-[44px]" aria-hidden>💌</p>
                <p className="mt-2 text-[24px] font-black">응답해주셔서 감사합니다 :)</p>
                <div className="mt-4 flex flex-col gap-1.5 text-[15px] font-semibold text-[#3a3a36] leading-relaxed [word-break:keep-all]">
                  {survey.thanks.map((t) => (
                    <p key={t}>{t}</p>
                  ))}
                </div>
                <Link href={`${here}?edit=1#form`} className="mt-6 inline-block text-[13px] text-cbt-gray underline hover:text-cbt-ink">
                  응답 고치기
                </Link>
              </div>
            ) : !user && !preview ? (
              <div className="text-center py-4">
                <p className="text-[20px] font-black">로그인하고 응답해 주세요</p>
                <p className="mt-2 text-[15px] font-semibold text-[#3a3a36] leading-relaxed [word-break:keep-all]">
                  한 분이 한 번만 응답할 수 있도록 소소숲 계정으로 받고 있어요. 1분이면 끝나요.
                </p>
                <Link
                  href={`/login?next=${encodeURIComponent(`${here}#form`)}`}
                  className="mt-6 inline-flex items-center px-8 py-3.5 border-2 border-cbt-ink bg-cbt-mint text-white text-[17px] font-black shadow-[5px_5px_0_0_#1a1a1a] hover:bg-cbt-mint-dark"
                >
                  로그인하고 설문 남기기 →
                </Link>
                <p className="mt-3 text-[13px] text-cbt-gray">구글·카카오 계정으로 바로 시작할 수 있어요.</p>
              </div>
            ) : (
              <SurveyForm
                survey={survey}
                email={user?.email ?? ''}
                defaultName={defaultName}
                previous={response ? { answers: response.answers, name: response.name, contact: response.contact } : null}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
