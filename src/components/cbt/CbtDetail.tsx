// 모의 CBT 이용권 상세페이지 — 인스타 캐러셀(2026-10-07)과 같은 문구·색.
// /slp-cbt-practice 소개 화면(CbtLanding)과 자료실 CBT 상품 상세(자료실 [id])가 같이 쓴다.
// 영상은 캐러셀 HTML에서 화면 부분만 잘라 만든 클립(public/videos/cbt).

import Link from 'next/link';
import type { ReactNode } from 'react';
import AutoVideo from './AutoVideo';

export const CBT_TRIAL_URL = 'https://cbt-trial.sososoop.com';

// 시험일 — 앱 index.html의 EXAM_INFO.exam과 같이 바꾼다. 지나면 D-day를 숨긴다.
const EXAM_DATE_KST = '2026-12-05';

export function daysToExam(now = new Date()): number | null {
  const KST = 9 * 60 * 60 * 1000;
  const today = new Date(now.getTime() + KST);
  const t = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [y, m, d] = EXAM_DATE_KST.split('-').map(Number);
  const diff = Math.round((Date.UTC(y, m - 1, d) - t) / 86400000);
  return diff >= 0 ? diff : null;
}

// 클립 크기(px) — render_panel.py 결과
export const CLIPS = {
  hero: { name: 'cbt-hero', w: 1428, h: 1058 },
  overview: { name: 'cbt-overview', w: 1428, h: 950 },
  time: { name: 'cbt-time', w: 1428, h: 962 },
  tools: { name: 'cbt-tools', w: 1428, h: 964 },
  result: { name: 'cbt-result', w: 1428, h: 1004 },
  wrongnote: { name: 'cbt-wrongnote', w: 1428, h: 906 },
  items: { name: 'cbt-items', w: 1428, h: 978 },
  beta: { name: 'cbt-beta', w: 1428, h: 714 },
} as const;
type Clip = (typeof CLIPS)[keyof typeof CLIPS];

const Em = ({ children }: { children: ReactNode }) => <span className="text-cbt-pop">{children}</span>;
const Red = ({ children }: { children: ReactNode }) => <span className="text-cbt-red">{children}</span>;

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex border-2 border-cbt-ink bg-white text-[14px] md:text-[15px] font-extrabold">
      <span className="bg-cbt-mint text-white px-3 py-1.5 border-r-2 border-cbt-ink">모의 CBT</span>
      <span className="px-3 py-1.5">{children}</span>
    </span>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((b, i) => (
        <li key={i} className="flex gap-3 items-start text-[17px] md:text-[18px] font-bold leading-[1.5] text-cbt-ink [word-break:keep-all]">
          <span className="flex-none mt-[2px] w-7 h-7 bg-cbt-mint text-white border-2 border-cbt-ink text-[14px] font-black flex items-center justify-center">
            {i + 1}
          </span>
          <span>{b}</span>
        </li>
      ))}
    </ol>
  );
}

function Feature({
  label,
  l1,
  l2,
  clip,
  alt,
  bullets,
  note,
  punch,
  flip,
}: {
  label: string;
  l1: ReactNode;
  l2: ReactNode;
  clip: Clip;
  alt: string;
  bullets: ReactNode[];
  note?: string;
  punch?: string;
  flip?: boolean;
}) {
  return (
    <section className="px-6 py-14 md:py-20 border-t-2 border-cbt-ink/10 first:border-t-0">
      <div className="max-w-[1120px] mx-auto grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-8 lg:gap-14 items-center">
        <div className={flip ? 'lg:order-2' : ''}>
          <Chip>{label}</Chip>
          <h2 className="mt-5 mb-7 tracking-tight [word-break:keep-all]">
            <span className="block text-[20px] md:text-[24px] font-bold text-[#4a4a46]">{l1}</span>
            <span className="block mt-1 text-[32px] md:text-[42px] font-black leading-[1.18] text-cbt-ink">{l2}</span>
          </h2>
          <Bullets items={bullets} />
          {punch && <p className="mt-7 text-[20px] md:text-[22px] font-black text-cbt-ink"><span className="cbt-mark">{punch}</span></p>}
          {note && <p className="mt-5 text-[13px] text-cbt-gray leading-relaxed [word-break:keep-all]">{note}</p>}
        </div>
        <div className={flip ? 'lg:order-1' : ''}>
          <div className="shadow-[10px_10px_0_0_#12B5A5]">
            <AutoVideo name={clip.name} width={clip.w} height={clip.h} alt={alt} />
          </div>
        </div>
      </div>
    </section>
  );
}

// 실제 앱 화면 캡처(기존 소개 화면에서 쓰던 것)
const SHOTS = [
  { src: '/images/preview/cbt-home.webp', label: '첫 화면', caption: '시험일정 · 남은 날짜 · 교시별 시간표 · 합격 기준을 먼저 보여 드려요.' },
  { src: '/images/preview/cbt-exam.webp', label: '시험 화면', caption: '계산기 · 그림판 · 형광펜 · 메모 · 체크문제와 글자 크기 · 화면 배치.' },
  { src: '/images/preview/cbt-result-2.webp', label: '결과 · 해설', caption: '과목별 정답률과 과락 여부, 틀린 문제만 모아 해설 보기.' },
];

type SectionsProps = {
  checkoutHref: string;
  /** 이용권 가격(원). 노션 상품값 — 없으면 가격 카드에 14,900원 */
  price?: number;
  /** 마지막 구매 영역에 붙일 버튼(장바구니 등). 없으면 구매 버튼만. */
  extraCta?: ReactNode;
};

export default function CbtDetailSections({ checkoutHref, price = 14900, extraCta }: SectionsProps) {
  return (
    <div className="cbt-grid text-cbt-ink">
      <Feature
        label="한눈에"
        l1="급수별 전 과목을"
        l2={<><Em>회차별로</Em> 실전처럼.</>}
        clip={CLIPS.overview}
        alt="1급 3회분 420문항과 2급 2회분 300문항, 총 720문항 — 급수별 과목 구성"
        bullets={[
          <>1급 3회분 · 2급 2회분, <span className="whitespace-nowrap"><Em>총 720문항</Em></span></>,
          <>급수별 실제 시험과 같은 과목 구성과 문항 수<span className="block text-[15px] font-semibold text-cbt-gray">1급 140문항(현장실무 포함) · 2급 150문항</span></>,
          <>3개월 동안 <Em>횟수 제한 없이</Em> 반복 응시</>,
        ]}
      />
      <Feature
        flip
        label="실전 시간"
        l1="문제만 풀지 말고"
        l2={<><Em>시간 감각</Em>까지 실전처럼.</>}
        clip={CLIPS.time}
        alt="교시 타이머, 종료 10분 전·5분 전 알림, 일시정지, 이어 풀기 화면"
        bullets={[
          <>실제 시험과 같은 <Em>교시 구성과 제한시간</Em><span className="block text-[15px] font-semibold text-cbt-gray">1급 72문항 75분 · 68문항 70분 / 2급 80문항 75분 · 70문항 65분</span></>,
          <>종료 <Em>10분 전 · 5분 전</Em> 자동 알림</>,
          <>창을 닫아도 <Em>풀던 답 그대로</Em> 이어서 응시</>,
        ]}
        note="※ 일시정지는 연습 편의를 위한 기능이며, 사용 횟수는 결과에 기록돼요."
      />
      <Feature
        label="시험 화면"
        l1="시험장 화면에"
        l2={<>미리 <Em>손을 익혀요.</Em></>}
        clip={CLIPS.tools}
        alt="형광펜, 보기 줄 긋기, 메모, 계산기, 글자 크기, 1면/2면 보기, 문제 모아보기"
        bullets={[
          <>형광펜 · 보기 줄 긋기 · 메모</>,
          <><Em>계산기</Em>를 활용한 계산형 문항 연습</>,
          <>글자 크기 · 1면/2면 보기 · 문제 모아보기까지</>,
        ]}
        punch="시험 날 처음 눌러보지 않도록."
      />
      <Feature
        flip
        label="결과"
        l1="지금 점수로"
        l2={<><Em>어디쯤인지</Em> 바로 확인해요.</>}
        clip={CLIPS.result}
        alt="총점, 과목별 점수와 40% 과락 기준선, 최근 5회 점수 추이와 과락 위험 과목"
        bullets={[
          <>과목별 점수와 <Red>40% 과락 기준</Red>을 한눈에</>,
          <>총점 <Em>60% 기준</Em>을 넘었는지 바로 확인<span className="block text-[15px] font-semibold text-cbt-gray">1급 140문항 중 84문항 · 2급 150문항 중 90문항</span></>,
          <>최근 5회 점수 추이와 <Red>과락 위험 과목</Red>까지</>,
        ]}
        note="※ 화면 속 수치는 예시예요 · 모의 CBT 결과는 실제 국가시험 합격을 보장하거나 예측하지 않아요."
      />
      <Feature
        label="오답노트"
        l1="모의고사를 풀수록"
        l2={<>내가 <Red>약한 영역</Red>이 보여요.</>}
        clip={CLIPS.wrongnote}
        alt="세부 영역별 오답률 막대, 가장 약한 영역 빨간색 표시, 그 영역 오답만 다시 풀기"
        bullets={[
          <>회차가 달라도 <Em>틀린 문항은 계속 누적</Em></>,
          <>세부 영역별 오답률을 <Em>자동으로 분석</Em></>,
          <>취약 영역을 누르면 그 영역에서 <Em>틀린 문제만</Em> 다시 풀기</>,
        ]}
        punch="오답을 찾는 시간 말고, 다시 푸는 데 시간을 쓰세요."
        note="※ 화면 속 수치는 예시예요."
      />
      <Feature
        flip
        label="문항과 해설"
        l1="답이 보이지 않게 만들고,"
        l2={<>왜 <Em>틀렸는지까지</Em> 설명했어요.</>}
        clip={CLIPS.items}
        alt="기출 유형 분석, 새로운 사례로 문항 제작, 기출과 대조, 보기 길이·표현 검수, 상세해설"
        bullets={[
          <>기출문제는 <Em>유형과 출제 포인트</Em>를 분석하는 데 활용</>,
          <>기존 기출과 겹치지 않도록 <Em>한 문항씩 대조 · 검수</Em></>,
          <>정답 보기만 유독 길어 힌트가 되지 않도록 <Em>보기 구성까지 확인</Em></>,
          <>정답 근거뿐 아니라 <Em>오답 보기까지</Em> 상세해설</>,
        ]}
      />

      {/* 실제 앱 화면 */}
      <section className="px-6 py-14 md:py-20 border-t-2 border-cbt-ink/10">
        <div className="max-w-[1120px] mx-auto">
          <Chip>실제 화면</Chip>
          <h2 className="mt-5 mb-8 text-[28px] md:text-[34px] font-black tracking-tight">실제 앱 화면도 미리 보세요</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {SHOTS.map((s) => (
              <a key={s.src} href={s.src} target="_blank" rel="noopener noreferrer" className="group block bg-white border-2 border-cbt-ink">
                <img src={s.src} alt={`언어재활사 모의 CBT ${s.label} 화면`} loading="lazy" className="block w-full aspect-[16/10] object-cover object-top border-b-2 border-cbt-ink" />
                <div className="p-4">
                  <p className="text-[16px] font-black">{s.label} <span className="text-cbt-pop text-[13px] font-bold group-hover:underline">크게 보기 ↗</span></p>
                  <p className="mt-1 text-[14px] text-cbt-gray font-medium leading-relaxed [word-break:keep-all]">{s.caption}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 만든 사람 · 가격 */}
      <section className="px-6 py-14 md:py-20 border-t-2 border-cbt-ink/10">
        <div className="max-w-[1120px] mx-auto">
          <Chip>만든 사람</Chip>
          <h2 className="mt-5 tracking-tight">
            <span className="block text-[20px] md:text-[24px] font-bold text-[#4a4a46]">CBT 국가시험을 직접 경험한</span>
            <span className="block mt-1 text-[32px] md:text-[42px] font-black leading-[1.18]"><Em>언어재활사</Em>가 만들었어요.</span>
          </h2>
          <p className="mt-5 inline-flex flex-wrap border-2 border-cbt-ink bg-white text-[15px] md:text-[17px] font-extrabold">
            <span className="bg-cbt-pop text-white px-4 py-2 border-r-2 border-cbt-ink">제14회 언어재활사 국가시험 차석 합격</span>
            <span className="px-4 py-2">언어재활사 이승윤</span>
          </p>
          <div className="mt-8 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6 items-stretch">
            <div className="shadow-[10px_10px_0_0_#12B5A5] self-start">
              <AutoVideo name={CLIPS.beta.name} width={CLIPS.beta.w} height={CLIPS.beta.h} alt="베타테스터 16명 중 15명(93.8%)이 유료로도 이용하고 싶다고 답함" />
            </div>
            <div className="flex flex-col gap-5">
              <div className="bg-white border-2 border-cbt-ink p-6">
                <p className="text-[16px] font-extrabold text-cbt-gray">그리고 정식판은</p>
                <p className="text-[52px] font-black tracking-tight leading-[1.1]">{price.toLocaleString()}<span className="text-[26px]">원</span></p>
                <p className="text-[16px] font-extrabold">3개월 · 횟수 제한 없이 반복 응시</p>
              </div>
              <div className="bg-cbt-mint-soft border-[2.5px] border-dashed border-cbt-mint-dark p-6">
                <p className="text-[22px] font-black text-cbt-mint-dark">재도전 응원 연장</p>
                <p className="mt-2 text-[16px] font-bold leading-relaxed [word-break:keep-all]">
                  이번 시험에서 원하는 결과를 얻지 못했다면<br />시험 결과 인증 후
                </p>
                <span className="inline-block mt-3 bg-cbt-mint text-white border-2 border-cbt-ink px-3 py-1 text-[26px] font-black">1년 무료연장 1회</span>
              </div>
            </div>
          </div>
          <p className="mt-6 text-[13px] text-cbt-gray leading-relaxed [word-break:keep-all]">
            ※ 베타테스터 수치는 설문 응답자 16명 기준 · 재도전 응원 연장은 별도 안내 기준에 따라 적용돼요.
          </p>
        </div>
      </section>

      {/* 무료 체험 */}
      <section className="px-6 py-16 md:py-24 border-t-2 border-cbt-ink/10">
        <div className="max-w-[880px] mx-auto text-center">
          <h2 className="tracking-tight">
            <span className="block text-[20px] md:text-[24px] font-bold text-[#4a4a46]">바로 구매하지 마세요.</span>
            <span className="block mt-1 text-[34px] md:text-[48px] font-black leading-[1.15]">먼저 <Em>직접 풀어보세요.</Em></span>
          </h2>
          <div className="mt-9 mx-auto max-w-[640px] flex flex-col sm:flex-row items-center gap-5 bg-white border-2 border-cbt-ink p-7 shadow-[12px_12px_0_0_#12B5A5] text-left">
            <span className="text-[72px] leading-none" aria-hidden>🎁</span>
            <div>
              <p className="text-[28px] md:text-[32px] font-black tracking-tight leading-tight"><Em>20문항</Em> 무료 CBT 체험</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['로그인 없이', '결제 없이', '해설까지'].map((t) => (
                  <span key={t} className="border-2 border-cbt-ink bg-cbt-mint-soft px-3 py-0.5 text-[15px] font-extrabold">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-2.5">
              <a
                href={CBT_TRIAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-7 py-3.5 border-2 border-cbt-ink bg-cbt-mint text-white text-[17px] font-black hover:bg-cbt-mint-dark transition-colors active:translate-x-[2px] active:translate-y-[2px]"
              >
                20문항 무료 체험하기 →
              </a>
              <span className="text-[13px] font-bold text-cbt-gray whitespace-nowrap">1급 문항 기준</span>
            </span>
            <Link
              href={checkoutHref}
              className="inline-flex items-center px-7 py-3.5 border-2 border-cbt-ink bg-cbt-pop text-white text-[17px] font-black hover:bg-[#2f49b0] transition-colors active:translate-x-[2px] active:translate-y-[2px]"
            >
              이용권 구매하기
            </Link>
            {extraCta}
          </div>
          <p className="mt-10 text-[22px] md:text-[26px] font-black leading-[1.6]">
            <span className="cbt-mark">시험 당일 처음 하지 마세요.</span>
            <br />
            <span className="cbt-mark">미리 해보고 들어가세요.</span>
          </p>
        </div>
      </section>
    </div>
  );
}
