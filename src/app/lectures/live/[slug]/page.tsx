import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyRegistration } from '@/lib/free-lives';
import { FREE_LIVE_CONSENT, getFreeLive, isLiveOpen } from '@/data/freeLives';
import AutoVideo from '@/components/cbt/AutoVideo';
import LiveApplyForm from './LiveApplyForm';
import { cancelFreeLive } from '../actions';

// 로그인·신청 여부에 따라 화면이 달라지므로 매번 새로 그린다.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const live = getFreeLive((await params).slug);
  if (!live) return {};
  const title = `${live.title} 신청`;
  const description = `${live.dateLabel} ${live.timeLabel} · ${live.place} · 참가비 무료 — ${live.summary}`;
  // 블로그·카톡 링크 카드에 사이트 기본 사진 대신 LIVE 안내 이미지가 뜨도록 한다.
  const image = { url: `/images/og/live-${live.slug}.jpg`, width: 1200, height: 630, alt: `${live.title} — ${live.dateLabel} ${live.timeLabel}` };
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      siteName: '소소숲:지혜의 기록소',
      url: `/lectures/live/${live.slug}`,
      title,
      description,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
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

function H2({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <h2 className="tracking-tight">
      <span className="block text-[17px] md:text-[19px] font-bold text-[#4a4a46]">{kicker}</span>
      <span className="block mt-1 text-[28px] md:text-[34px] font-black leading-[1.2]">{children}</span>
    </h2>
  );
}

const Em = ({ children }: { children: React.ReactNode }) => <span className="text-cbt-pop">{children}</span>;

export default async function FreeLivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const live = getFreeLive(slug);
  if (!live) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const registration = user ? await getMyRegistration(live.slug, user.id) : null;
  const open = isLiveOpen(live);
  const meta = user?.user_metadata ?? {};
  const defaultName = String(meta.name || meta.full_name || meta.nickname || '');
  const here = `/lectures/live/${live.slug}`;

  const facts = [
    ['📅', '날짜', live.dateLabel],
    ['⏰', '시간', live.timeLabel],
    ['💻', '장소', live.place],
    ['💰', '참가비', '무료'],
  ];

  return (
    <div className="cbt-grid text-cbt-ink">
      {/* 첫 화면 */}
      <section className="px-6 pt-10 pb-14 md:pt-14 md:pb-20">
        <div className="max-w-[1120px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] gap-10 items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Chip>무료 LIVE</Chip>
              <span className="inline-flex items-center gap-2 bg-cbt-ink text-white text-[14px] font-black tracking-[0.08em] px-3 py-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cbt-red animate-pulse" aria-hidden />
                LIVE
              </span>
            </div>
            <h1 className="mt-6 tracking-tight">
              <span className="block text-[22px] md:text-[26px] font-bold text-[#4a4a46]">언어재활사 CBT,</span>
              <span className="block mt-1 text-[38px] md:text-[54px] font-black leading-[1.12] [word-break:keep-all]">
                시험 전에 <Em>한번 같이</Em> 봐요.
              </span>
            </h1>
            <p className="mt-5 text-[17px] md:text-[18px] font-semibold text-[#3a3a36] leading-relaxed [word-break:keep-all]">
              {live.summary}예요.
            </p>
            <dl className="mt-7 grid grid-cols-2 gap-3 max-w-[520px]">
              {facts.map(([icon, k, v]) => (
                <div key={k} className="bg-white border-2 border-cbt-ink px-4 py-3">
                  <dt className="text-[13px] font-bold text-cbt-gray">{icon} {k}</dt>
                  <dd className="mt-0.5 text-[18px] font-black">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#apply"
                className="inline-flex items-center px-7 py-3.5 border-2 border-cbt-ink bg-cbt-mint text-white text-[17px] font-black shadow-[5px_5px_0_0_#1a1a1a] hover:bg-cbt-mint-dark"
              >
                {registration ? '신청 내역 보기 ↓' : open ? '무료로 신청하기 ↓' : '신청 마감'}
              </a>
              <span className="text-[14px] font-bold text-cbt-gray">제14회 국가시험 차석 합격자 · 언어재활사 이승윤</span>
            </div>
          </div>
          <div>
            <AutoVideo name="live-cbt-1013" width={1464} height={1208} alt="10월 13일 화요일 저녁 9시 무료 LIVE — 달력과 시계" />
          </div>
        </div>
      </section>

      {/* 이런 걱정 */}
      <section className="px-6 py-14 md:py-20 border-t-2 border-cbt-ink/10">
        <div className="max-w-[1120px] mx-auto">
          <H2 kicker="문제는 열심히 풀고 있는데,">이런 <span className="text-cbt-red">걱정</span> 있으세요?</H2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {live.worries.map((w) => (
              <p key={w} className="relative bg-white border-2 border-cbt-ink rounded-[20px] px-5 py-6 text-[18px] font-black leading-snug [word-break:keep-all]">
                <span className="absolute -top-3 right-4 w-8 h-8 rounded-full bg-cbt-red text-white border-2 border-cbt-ink flex items-center justify-center text-[16px]" aria-hidden>?</span>
                {w}
              </p>
            ))}
          </div>
          <p className="mt-8 text-[16px] md:text-[17px] font-semibold text-[#3a3a36] leading-relaxed max-w-[760px] [word-break:keep-all]">
            얼마 전 CBT 관련 특강을 진행하면서, 문제 자체보다 <span className="cbt-mark font-black text-cbt-ink">컴퓨터로 시험을 본다는 것</span>을
            부담스러워하시는 선생님들이 생각보다 많다는 걸 느꼈어요. 그래서 이번에는 시험 전에 실제 CBT 환경을 어떻게 연습하면 좋은지
            같이 보는 무료 LIVE를 열어요.
          </p>
        </div>
      </section>

      {/* 다루는 것 · 다루지 않는 것 */}
      <section className="px-6 py-14 md:py-20 border-t-2 border-cbt-ink/10">
        <div className="max-w-[1120px] mx-auto grid lg:grid-cols-2 gap-10">
          <div>
            <H2 kicker="이번 LIVE에서는"><Em>이것들을</Em> 같이 봐요.</H2>
            <ol className="mt-7 flex flex-col gap-2.5">
              {live.topics.map((t, i) => (
                <li key={t} className="flex items-center gap-3 bg-white border-2 border-cbt-ink px-4 py-3">
                  <span className="w-8 h-8 shrink-0 bg-cbt-ink text-white text-[14px] font-black flex items-center justify-center">{i + 1}</span>
                  <span className="text-[16px] font-bold">{t}</span>
                  <span className="ml-auto w-7 h-7 shrink-0 bg-cbt-mint border-2 border-cbt-ink text-white text-[14px] font-black flex items-center justify-center" aria-hidden>✓</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <H2 kicker="한 가지는 꼭"><Em>미리</Em> 말씀드릴게요.</H2>
            <div className="mt-7 bg-[#0d0d0c] text-white border-2 border-cbt-ink p-7">
              <p className="text-[16px] font-bold text-[#b9b9b2]">이번 LIVE는</p>
              <p className="mt-1 text-[26px] font-black">문제풀이 특강이 <span className="text-[#ff6b5f]">아니에요.</span></p>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {live.excluded.map((x) => (
                  <span key={x} className="relative border-2 border-[#4a4a46] px-3 py-2.5 text-center text-[15px] font-bold text-[#8a8a82] line-through decoration-[#ff6b5f] decoration-2">
                    {x}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-[15px] text-[#b9b9b2] font-bold">“무엇을 공부할지”보다</p>
              <p className="text-[22px] font-black text-[#5fe0d2]">“CBT 시험을 어떻게 준비할지”</p>
              <p className="text-[16px] font-bold">에 집중합니다.</p>
              <p className="mt-5 text-[13px] text-[#9a9a92] leading-relaxed [word-break:keep-all]">
                ※ 과목별 문제풀이 · 암기법 · 공부전략 · 기출문제 해설은 기존 유료 국시 후기 특강에서 다뤘던 내용이라 이번 무료 LIVE에서는 빼고 진행해요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 안내 */}
      <section className="px-6 py-14 md:py-20 border-t-2 border-cbt-ink/10">
        <div className="max-w-[1120px] mx-auto grid md:grid-cols-2 gap-5">
          <div className="bg-white border-2 border-cbt-ink p-6 shadow-[8px_8px_0_0_#12B5A5]">
            <p className="text-[18px] font-black">📌 솔직하게</p>
            <p className="mt-3 text-[15px] font-semibold leading-relaxed [word-break:keep-all]">{live.notes[0]}</p>
          </div>
          <div className="bg-cbt-mint-soft border-[2.5px] border-dashed border-cbt-mint-dark p-6">
            <p className="text-[18px] font-black text-cbt-mint-dark">준비 중 · 오프라인 모의훈련</p>
            <p className="mt-3 text-[15px] font-semibold leading-relaxed [word-break:keep-all]">{live.offline}</p>
          </div>
        </div>
      </section>

      {/* 신청 */}
      <section id="apply" className="px-6 py-14 md:py-20 border-t-2 border-cbt-ink/10 scroll-mt-20">
        <div className="max-w-[760px] mx-auto">
          <H2 kicker={`${live.dateLabel} ${live.timeLabel} · ${live.place} · 무료`}>{live.title} <Em>신청</Em></H2>
          <p className="mt-3 text-[15px] font-semibold text-[#3a3a36] [word-break:keep-all]">{live.notes[1]}</p>

          <div className="mt-8 bg-white border-2 border-cbt-ink p-6 md:p-8 shadow-[12px_12px_0_0_#12B5A5]">
            {registration ? (
              <div className="text-center py-4">
                <p className="text-[44px]" aria-hidden>🎉</p>
                <p className="mt-2 text-[24px] font-black">신청이 완료되었어요!</p>
                <p className="mt-3 text-[15px] font-semibold text-[#3a3a36] leading-relaxed [word-break:keep-all]">
                  {registration.name} 선생님, {live.dateLabel} {live.timeLabel}에 만나요.
                  <br />ZOOM 접속 링크는 <strong>마이페이지</strong>에서 확인할 수 있어요.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/mypage#lives" className="inline-flex items-center px-6 py-3 border-2 border-cbt-ink bg-cbt-pop text-white text-[16px] font-black hover:bg-[#2f49b0]">
                    마이페이지에서 ZOOM 링크 보기 →
                  </Link>
                </div>
                {open && (
                  <form action={cancelFreeLive} className="mt-6">
                    <input type="hidden" name="slug" value={live.slug} />
                    <button className="text-[13px] text-cbt-gray underline hover:text-cbt-ink">참석이 어려워졌다면 신청 취소하기</button>
                  </form>
                )}
              </div>
            ) : !open ? (
              <p className="py-8 text-center text-[18px] font-black">신청이 마감되었어요.</p>
            ) : !user ? (
              <div className="text-center py-4">
                <p className="text-[20px] font-black">로그인하고 신청해 주세요</p>
                <p className="mt-2 text-[15px] font-semibold text-[#3a3a36] leading-relaxed [word-break:keep-all]">
                  소소숲 계정으로 신청하면, ZOOM 접속 링크를 <strong>마이페이지</strong>에서 바로 확인할 수 있어요.
                </p>
                <Link
                  href={`/login?next=${encodeURIComponent(`${here}#apply`)}`}
                  className="mt-6 inline-flex items-center px-8 py-3.5 border-2 border-cbt-ink bg-cbt-mint text-white text-[17px] font-black shadow-[5px_5px_0_0_#1a1a1a] hover:bg-cbt-mint-dark"
                >
                  로그인하고 신청하기 →
                </Link>
                <p className="mt-3 text-[13px] text-cbt-gray">구글·카카오 계정으로 바로 시작할 수 있어요.</p>
              </div>
            ) : (
              <LiveApplyForm
                slug={live.slug}
                defaultName={defaultName}
                email={user.email ?? ''}
                examOptions={live.examOptions}
                worryOptions={live.worryOptions}
                offlineOptions={live.offlineOptions}
                dateLabel={live.dateLabel}
                timeLabel={live.timeLabel}
                consent={FREE_LIVE_CONSENT}
              />
            )}
          </div>
          <p className="mt-10 text-center text-[20px] md:text-[22px] font-black leading-relaxed">
            <span className="cbt-mark">시험 당일 처음 하지 마세요.</span>
            <br />
            <span className="cbt-mark">미리 한번 해보고 들어가세요.</span>
          </p>
        </div>
      </section>
    </div>
  );
}
