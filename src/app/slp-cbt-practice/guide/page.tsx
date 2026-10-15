// 모의 CBT 사용설명서 — 앱 첫 화면의 '사용설명서' 버튼이 새 탭으로 연다. 이용권 없이도 볼 수 있다.
// 단계마다 실제 앱 화면을 움직이는 클립(public/videos/cbt/guide-*.mp4)과 설명 글.
// 클립 원본: ~/클로드/국시/05_베타_홍보/사용설명서 (capture.py → g01~g11.html → render_guide.py)
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import AutoVideo from '@/components/cbt/AutoVideo';
import { Chip } from '@/components/cbt/CbtDetail';

export const metadata: Metadata = {
  title: '모의 CBT 사용설명서',
  description: '언어재활사 모의 CBT 사용법 — 응시 정보 고르기, 시험 화면 기능, 제출·결과·해설, 응시 기록과 오답노트까지 화면으로 안내해요.',
};

const KAKAO = 'http://pf.kakao.com/_gngTX';
const CLIP = { w: 1440, h: 960 };

const Em = ({ children }: { children: ReactNode }) => <span className="text-cbt-pop">{children}</span>;
const B = ({ children }: { children: ReactNode }) => <b className="font-extrabold text-cbt-ink">{children}</b>;

type Step = {
  no: string;
  toc: string; // 차례·영상 위 단계 이름
  clip: string;
  l1: string;
  l2: ReactNode;
  alt: string;
  items: ReactNode[];
  tip?: ReactNode;
};
type Part = { id: string; no: string; title: string; steps: Step[] };

const PARTS: Part[] = [
  {
    id: 'part-1',
    no: 'PART 1',
    title: '시작하기',
    steps: [
      {
        no: '01',
        toc: '처음 화면',
        clip: 'guide-01-home',
        l1: '앱을 열면 먼저',
        l2: <><Em>처음 화면</Em>이 나와요.</>,
        alt: '처음 화면 — 시험일까지 남은 날, 내 학습 기록, 시험일정과 교시별 시간표, 모의 CBT 연습 버튼',
        items: [
          <>소소숲에 <B>구매한 계정</B>으로 로그인한 뒤 모의 CBT 메뉴로 들어오면 앱이 열려요.</>,
          <>시험일까지 남은 날(D-day), <B>내 학습 기록</B>, 시험일정 · 교시별 시간표 · 합격 기준을 한 화면에서 봐요.</>,
          <>가운데 <B>모의 CBT 연습</B> 버튼을 누르면 시작해요.</>,
        ],
        tip: <>PC · 노트북 화면에 맞춰 만들었어요. 한 계정은 <B>한 기기(한 브라우저)</B>에서만 쓸 수 있어요.</>,
      },
      {
        no: '02',
        toc: '응시 정보 고르기',
        clip: 'guide-02-start',
        l1: '시험 보기 전에',
        l2: <><Em>급수 · 회차 · 교시</Em>를 골라요.</>,
        alt: '응시 정보 입력 화면 — 급수, 회차, 교시를 고르고 성명을 적은 뒤 입장하기',
        items: [
          <><B>급수 → 회차 → 교시</B> 순서로 고르고 성명을 적어요. 성명은 시험 화면 위에 표시돼요.</>,
          <>문항 수와 시험시간은 <B>실제 국가시험과 같아요</B>. 1교시를 고르면 제출한 뒤 2교시로 이어 풀 수 있어요.</>,
          <><B>입장하기</B>를 누르는 순간 제한시간이 흘러가요.</>,
        ],
      },
      {
        no: '03',
        toc: '시간 관리 · 이어 풀기',
        clip: 'guide-03-time',
        l1: '시간은 실제처럼,',
        l2: <>멈춰도 <Em>이어서</Em> 풀 수 있어요.</>,
        alt: '남은 시간이 줄어드는 시계, 일시정지 창, 창을 다시 열었을 때 나오는 풀던 시험이 있어요 안내',
        items: [
          <>화면 위 <B>남은 시간</B>이 실제 시험처럼 줄어들고, 10분 · 5분 남으면 알림이 떠요. 시간이 끝나면 자동으로 제출돼요.</>,
          <>아래 <B>일시정지</B>를 누르면 시계가 멈추고 문제가 가려져요(연습용이라 실제 시험에는 없어요).</>,
          <>창을 닫거나 새로고침해도 다시 들어오면 <B>이어서 풀기</B> 안내가 떠요. 닫아 둔 동안에는 시간이 흐르지 않아요.</>,
        ],
        tip: <>이어 풀 수 있는 시험은 한 번에 하나예요. &lsquo;오답 다시 풀기&rsquo;는 이어 풀기가 되지 않아요.</>,
      },
    ],
  },
  {
    id: 'part-2',
    no: 'PART 2',
    title: '시험 화면',
    steps: [
      {
        no: '04',
        toc: '답 고르고 바꾸기',
        clip: 'guide-04-answer',
        l1: '보기를 누르면',
        l2: <><Em>답이 골라져요.</Em></>,
        alt: '보기를 눌러 답을 고르고, 다른 보기를 눌러 답을 바꾸고, 오답 버튼으로 보기를 지우는 모습',
        items: [
          <>보기를 누르면 답이 골라지고, <B>다른 보기를 누르면 바뀌어요</B>. 같은 보기를 다시 누르면 취소돼요.</>,
          <>보기 오른쪽 <B>오답</B> 버튼으로 아닌 보기를 흐리게 지워 둘 수 있어요.</>,
          <>위 막대에 <B>푼 문항 수</B>가 쌓여요.</>,
        ],
      },
      {
        no: '05',
        toc: '문제 이동 · 체크',
        clip: 'guide-05-move',
        l1: '헷갈리는 문제는 체크하고,',
        l2: <>모아 보며 <Em>바로 이동</Em>해요.</>,
        alt: '체크문제 표시, 이전·다음 버튼, 문제 모아보기 창의 전체·체크·안푼 문제 탭',
        items: [
          <>문제 오른쪽 위 <B>체크문제</B>를 누르면 나중에 다시 볼 문제로 표시돼요.</>,
          <>아래 <B>이전 · 다음</B>으로 한 문제씩 넘기고, <B>전체 · 체크 · 안푼 문제</B> 버튼을 누르면 문제 모아보기 창이 열려요.</>,
          <>모아보기 창에서 문제를 누르면 그 문제로 바로 이동해요. 마지막에 <B>안 푼 문제</B>만 골라 마무리하세요.</>,
        ],
      },
      {
        no: '06',
        toc: '풀이 도구',
        clip: 'guide-06-tools',
        l1: '실제 시험처럼',
        l2: <><Em>풀이 도구</Em>도 써 봐요.</>,
        alt: '메모, 형광펜, 계산기, 그림판, 글자 크기, 1단·2단 화면 배치',
        items: [
          <><B>메모</B> — 문제마다 짧은 메모를 남겨요. <B>형광펜</B> — 켜고 지문을 드래그하면 칠해지고, 칠한 곳을 누르면 지워져요.</>,
          <>왼쪽 <B>계산기</B>로 계산 문제를, <B>그림판</B>에 풀이 과정을 적어요.</>,
          <><B>글자 크기</B>(80 · 100 · 125%)와 <B>화면 배치</B>(한 화면에 1문제 · 2문제)를 바꿀 수 있어요.</>,
        ],
      },
      {
        no: '07',
        toc: '제출 · 다음 교시',
        clip: 'guide-07-submit',
        l1: '다 풀었으면',
        l2: <><Em>제출</Em>하고 다음 교시로.</>,
        alt: '제출하기를 누르면 안 푼 문제 수를 알려 주고, 제출 완료 창에서 문제로 돌아가기·다음 교시 시작·결과 보기를 고르는 모습',
        items: [
          <>오른쪽 아래 <B>제출하기</B>를 누르면 안 푼 문제가 몇 개인지 먼저 알려 줘요.</>,
          <>제출한 뒤에도 시간이 남아 있으면 <B>문제로 돌아가</B> 답을 고칠 수 있어요.</>,
          <><B>다음 교시 시작</B>으로 이어 풀거나, 여기서 <B>결과 보기</B>를 눌러 지금까지 푼 교시만 채점할 수 있어요.</>,
        ],
      },
    ],
  },
  {
    id: 'part-3',
    no: 'PART 3',
    title: '채점 · 해설',
    steps: [
      {
        no: '08',
        toc: '결과 보기',
        clip: 'guide-08-result',
        l1: '제출하면 바로',
        l2: <><Em>합격권인지</Em> 알려 줘요.</>,
        alt: '시험 결과 화면 — 합격권 판정, 과목별 정답률 표, 오답노트에 담긴 문항 수와 지난번 대비',
        items: [
          <>실제 합격 기준(<B>평균 60% 이상 · 매 과목 40% 이상</B>)으로 합격권 · 불합격권을 판정하고 풀이 시간도 보여 줘요.</>,
          <>과목마다 문항 수 · 정답 수 · 정답률이 나오고, 40% 미만 과목은 <B>과락</B>으로 표시돼요.</>,
          <>틀리거나 비운 문항은 <B>오답노트에 저절로</B> 담기고, 지난번보다 과목별로 얼마나 올랐는지도 알려 줘요.</>,
        ],
      },
      {
        no: '09',
        toc: '해설 · 상세해설',
        clip: 'guide-09-review',
        l1: '틀린 이유까지',
        l2: <><Em>해설 · 상세해설</Em>로 확인해요.</>,
        alt: '전체 해설 화면 — 영역 태그, 출제 포인트와 핵심개념, 해설, 펼친 상세해설',
        items: [
          <>결과 화면에서 <B>틀린 문제만 보기</B> 또는 <B>전체 해설 보기</B>를 눌러요. 정답과 내가 고른 답이 함께 표시돼요.</>,
          <>문항마다 <B>영역 태그 · 출제 포인트 · 핵심개념</B>으로 무엇을 묻는 문제인지 한눈에 봐요.</>,
          <><B>상세해설 보기</B>를 누르면 정답 근거와 보기마다 오답 점검이 펼쳐져요.</>,
        ],
        tip: <>해설은 앱 화면에서만 볼 수 있어요(인쇄 · PDF 저장은 지원하지 않아요).</>,
      },
    ],
  },
  {
    id: 'part-4',
    no: 'PART 4',
    title: '학습 기록',
    steps: [
      {
        no: '10',
        toc: '응시 기록',
        clip: 'guide-10-history',
        l1: '여러 번 풀수록',
        l2: <><Em>약한 과목</Em>이 보여요.</>,
        alt: '응시 기록 화면 — 과목별 정답률 추이 막대, 과락 위험·주의 표시, 응시 목록, 1급·2급 버튼',
        items: [
          <>처음 화면의 <B>응시 기록 보기</B>에서 과목별 정답률이 최근 5회까지 막대로 쌓여요.</>,
          <>최근 3회 평균이 <B>40% 미만이면 과락 위험</B>, 60% 미만이면 주의로 표시돼요.</>,
          <>아래 <B>응시 목록</B>에서 날짜 · 총점 · 판정 · 과락 과목을 보고, 1급 · 2급을 둘 다 풀었다면 버튼으로 나눠 봐요.</>,
        ],
      },
      {
        no: '11',
        toc: '오답노트',
        clip: 'guide-11-wrongnote',
        l1: '틀린 문제만 모아',
        l2: <><Em>오답노트</Em>로 다시 풀어요.</>,
        alt: '오답노트 화면 — 과목 버튼, 어디가 약한지 보기 그래프, 오답 목록, 오답만 다시 풀기',
        items: [
          <>회차가 달라도 틀린 문제가 <B>과목별로 계속</B> 쌓여요. 과목 버튼으로 골라 볼 수 있어요.</>,
          <><B>어디가 약한지 보기</B>에서 세부 영역별 오답률을 보고, 막대를 누르면 그 영역 문제만 추려져요.</>,
          <>문항마다 몇 번 틀렸는지 · 해설 보기 · 빼기가 있고, <B>오답만 다시 풀기</B>로 다시 풀어 맞히면 저절로 빠져요.</>,
        ],
      },
    ],
  },
];

function StepBlock({ step, flip }: { step: Step; flip: boolean }) {
  return (
    <section id={`step-${step.no}`} className="px-6 py-12 md:py-16 border-t-2 border-cbt-ink/10 scroll-mt-20">
      <div className="max-w-[1120px] mx-auto grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-8 lg:gap-12 items-center">
        <div className={flip ? 'lg:order-2' : ''}>
          <span className="font-mono text-[14px] font-bold tracking-[0.14em] text-cbt-red">STEP {step.no} · {step.toc}</span>
          <h3 className="mt-3 mb-6 tracking-tight [word-break:keep-all]">
            <span className="block text-[19px] md:text-[22px] font-bold text-[#4a4a46]">{step.l1}</span>
            <span className="block mt-1 text-[30px] md:text-[38px] font-black leading-[1.2] text-cbt-ink">{step.l2}</span>
          </h3>
          <ol className="flex flex-col gap-3">
            {step.items.map((it, i) => (
              <li key={i} className="flex gap-3 items-start text-[16px] md:text-[17px] font-semibold leading-[1.6] text-[#2a2a28] [word-break:keep-all]">
                <span className="flex-none mt-[3px] w-6 h-6 bg-cbt-mint text-white border-2 border-cbt-ink text-[12px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
                <span>{it}</span>
              </li>
            ))}
          </ol>
          {step.tip && (
            <p className="mt-6 px-4 py-3 bg-[#fff8db] border-2 border-cbt-ink text-[14px] font-semibold leading-relaxed text-[#3a3a36] [word-break:keep-all]">
              💡 {step.tip}
            </p>
          )}
        </div>
        <div className={flip ? 'lg:order-1' : ''}>
          <div className="border-2 border-cbt-ink shadow-[10px_10px_0_0_#12B5A5] bg-white">
            <AutoVideo name={step.clip} width={CLIP.w} height={CLIP.h} alt={step.alt} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CbtGuidePage() {
  let n = 0;
  return (
    <div className="cbt-grid text-cbt-ink">
      {/* 첫 화면 */}
      <section className="px-6 pt-10 pb-12 md:pt-14 md:pb-16">
        <div className="max-w-[1120px] mx-auto">
          <Chip>사용설명서</Chip>
          <h1 className="mt-6 tracking-tight [word-break:keep-all]">
            <span className="block text-[22px] md:text-[26px] font-bold text-[#4a4a46]">언어재활사 모의 CBT,</span>
            <span className="block mt-1 text-[38px] md:text-[54px] font-black leading-[1.12]">
              <Em>이렇게</Em> 쓰면 돼요.
            </span>
          </h1>
          <p className="mt-5 max-w-[760px] text-[17px] md:text-[18px] font-semibold text-[#3a3a36] leading-relaxed [word-break:keep-all]">
            응시 정보 고르기부터 시험 화면 기능, 결과 · 해설, 응시 기록과 오답노트까지 실제 앱 화면으로 순서대로 보여 드려요.
            영상은 화면에 보일 때 저절로 재생돼요.
          </p>

          <nav aria-label="사용설명서 차례" className="mt-9 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PARTS.map((p) => (
              <div key={p.id} className="bg-white border-2 border-cbt-ink p-5">
                <a href={`#${p.id}`} className="block hover:text-cbt-pop">
                  <span className="font-mono text-[12px] font-bold tracking-[0.14em] text-cbt-red">{p.no}</span>
                  <span className="block mt-1 text-[20px] font-black">{p.title}</span>
                </a>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {p.steps.map((s) => (
                    <li key={s.no}>
                      <a href={`#step-${s.no}`} className="flex gap-2 text-[14px] font-semibold text-[#3a3a36] hover:text-cbt-pop [word-break:keep-all]">
                        <span className="font-mono text-cbt-gray">{s.no}</span>
                        <span>{s.toc}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-6 grid md:grid-cols-3 gap-3">
            {[
              ['💻', 'PC · 노트북에서', '실제 시험처럼 컴퓨터 화면 기준이에요. 휴대폰에서는 \'PC에서 이용해 주세요\' 안내가 떠요.'],
              ['🔒', '한 계정은 한 기기', '한 기기(한 브라우저)에서만 쓸 수 있어요. 바꾸려면 새 기기에서 [이 기기로 옮기기]를 누르세요(14일에 한 번).'],
              ['💾', '기록은 이 기기에', '응시 기록 · 오답노트는 지금 쓰는 브라우저에 저장돼요. 브라우저 데이터를 지우면 초기화돼요.'],
            ].map(([icon, t, d]) => (
              <div key={t} className="bg-cbt-mint-soft border-2 border-cbt-ink px-4 py-3.5">
                <p className="text-[15px] font-black">{icon} {t}</p>
                <p className="mt-1 text-[13.5px] font-semibold text-[#3a3a36] leading-relaxed [word-break:keep-all]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {PARTS.map((p) => (
        <div key={p.id} id={p.id} className="scroll-mt-16">
          <div className="px-6 pt-10 md:pt-14 border-t-2 border-cbt-ink">
            <div className="max-w-[1120px] mx-auto flex items-baseline gap-4">
              <span className="font-mono text-[14px] font-bold tracking-[0.14em] text-cbt-red">{p.no}</span>
              <h2 className="text-[26px] md:text-[32px] font-black tracking-tight">{p.title}</h2>
            </div>
          </div>
          {p.steps.map((s) => (
            <StepBlock key={s.no} step={s} flip={n++ % 2 === 1} />
          ))}
        </div>
      ))}

      {/* 마무리 */}
      <section className="px-6 py-14 md:py-20 border-t-2 border-cbt-ink">
        <div className="max-w-[760px] mx-auto text-center">
          <p className="text-[22px] md:text-[26px] font-black leading-snug [word-break:keep-all]">
            <span className="cbt-mark">시험 당일 처음 하지 마세요.</span>
            <br />
            <span className="cbt-mark">미리 해보고 들어가세요.</span>
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/slp-cbt-practice/faq"
              className="inline-flex items-center px-6 py-3 border-2 border-cbt-ink bg-white text-[16px] font-black hover:bg-cbt-mint-soft"
            >
              자주 묻는 질문 →
            </Link>
            <a
              href={KAKAO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border-2 border-cbt-ink bg-cbt-mint text-white text-[16px] font-black shadow-[5px_5px_0_0_#1a1a1a] hover:bg-cbt-mint-dark"
            >
              고객센터에 묻기 →
            </a>
          </div>
          <p className="mt-6 text-[13px] text-cbt-gray leading-relaxed [word-break:keep-all]">
            영상 속 문항은 무료 체험판에 공개된 문항이에요. 화면 구성은 2026년 10월 기준이며, 앱이 바뀌면 함께 고쳐 둘게요.
          </p>
        </div>
      </section>
    </div>
  );
}
