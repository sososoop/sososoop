// 모의 CBT 자주 묻는 질문 — /slp-cbt-practice 소개 화면(CbtLanding) 아래.
// 답은 실제 동작(이용기간·기기 제한·브라우저 저장·쿠폰)과 맞춰 두었다. 규칙을 바꾸면 여기도 같이 고친다.

import Link from 'next/link';
import { isValidElement, type ReactNode } from 'react';
import { CBT_TRIAL_URL } from './CbtDetail';
import FaqList from './FaqList';

const KAKAO = 'http://pf.kakao.com/_gngTX';

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-cbt-pop underline">
    {children}
  </a>
);
const B = ({ children }: { children: ReactNode }) => <b className="font-extrabold text-cbt-ink">{children}</b>;

// k: 답에 없는 말로 찾을 때 걸리게 하는 검색어(띄어쓰기 없이 찾아도 걸린다)
const FAQ: { q: string; k?: string; a: ReactNode }[] = [
  {
    q: '어디서 로그인하나요?',
    k: '로그인 구글 카카오 계정 아이디 회원가입 구매 화면',
    a: (
      <>
        소소숲 사이트 오른쪽 위 <Link href="/login?next=/slp-cbt-practice" className="font-bold text-cbt-pop underline">로그인</Link>에서
        구글 또는 카카오 계정으로 로그인한 뒤 이 페이지로 오면 바로 시작돼요. <B>구매할 때 쓴 계정</B>으로 로그인해야 하며,
        다른 계정으로 들어오면 구매 화면이 보여요.
      </>
    ),
  },
  {
    q: '무료 체험과 정식 이용권은 뭐가 다른가요?',
    k: '체험판 무료 맛보기 차이 가격',
    a: (
      <>
        <A href={CBT_TRIAL_URL}>무료 체험</A>은 로그인·결제 없이 1급 20문항을 해설까지 풀어 볼 수 있어요. 정식 이용권은{' '}
        <B>전체 회차를 실제 교시·제한시간 그대로</B> 풀 수 있고, 오답노트·응시 기록·이어 풀기·상세해설까지 이용할 수 있어요.
      </>
    ),
  },
  {
    q: '이용기간 3개월은 언제부터인가요?',
    k: '기간 만료 끝나는 날 언제까지 유효기간',
    a: (
      <>
        <B>결제한 날부터 3개월 뒤 같은 날 밤 11시 59분까지</B>예요. 그달에 같은 날짜가 없으면 그달 마지막 날까지예요
        (예: 11월 30일 결제 → 2월 28일까지). 남은 기간은 앱 화면 맨 위에 &lsquo;이용기간: ○월 ○일까지&rsquo;로 표시되고,
        기간 중 추가되는 회차도 그대로 이용할 수 있어요.
      </>
    ),
  },
  {
    q: '몇 번까지 응시할 수 있나요?',
    k: '횟수 제한 반복 다시 풀기 재응시',
    a: <>횟수 제한이 없어요. 이용기간 안에서는 같은 회차도 <B>몇 번이든 다시</B> 풀 수 있어요.</>,
  },
  {
    q: 'PC·노트북에서만 사용해야 하나요?',
    k: '모바일 휴대폰 핸드폰 아이폰 갤럭시 태블릿 아이패드 맥북',
    a: (
      <>
        네. 실제 국가시험이 컴퓨터로 치러지기 때문에 PC 화면 기준으로 만들었어요. 휴대폰이나 세로로 든 태블릿에서는
        &lsquo;PC에서 이용해 주세요&rsquo; 안내가 떠요(아이패드는 가로로 돌리면 이용할 수 있어요). 또한{' '}
        <B>한 계정은 한 기기(한 브라우저)에서만</B> 쓸 수 있어요. 기기를 바꿔야 하면 고객센터로 알려 주세요.
      </>
    ),
  },
  {
    q: '‘다른 기기에 등록된 계정이에요’가 떠요. 기기를 바꾸고 싶어요.',
    k: '기기 초기화 기기변경 기기 변경 등록 해제 노트북 바꿈 바꿨 바꾼 바꿔 새 컴퓨터 접속 안 됨 막힘 차단 크롬 엣지 사파리 시크릿',
    a: (
      <>
        이용권은 <B>처음 연 기기의 브라우저 한 곳</B>에만 등록돼요. 아래 경우에 이 안내가 떠요.
        <ul className="mt-2 flex flex-col gap-1 list-disc pl-5">
          <li>다른 컴퓨터·노트북에서 들어왔을 때</li>
          <li>같은 컴퓨터라도 다른 브라우저(예: 크롬 → 엣지)나 시크릿 창으로 들어왔을 때</li>
          <li>브라우저의 쿠키·사이트 데이터를 지웠을 때</li>
        </ul>
        <span className="block mt-2">
          처음 쓰던 기기·브라우저로 들어가면 그대로 이용할 수 있어요. 기기를 바꿔야 하면 <A href={KAKAO}>고객센터</A>로{' '}
          <B>로그인한 계정(구글/카카오, 이메일)</B>을 알려 주세요. 기기 등록을 초기화해 드리면, 그다음에 처음 들어오는 기기가 새로
          등록돼요. 이전 기기에 있던 응시 기록과 오답노트는 새 기기로 옮겨지지 않아요.
        </span>
      </>
    ),
  },
  {
    q: '답안이 저장되나요?',
    k: '저장 기록 사라짐 날아감 초기화',
    a: (
      <>
        네. 풀던 답은 <B>지금 쓰는 기기의 브라우저에 자동 저장</B>돼요. 서버가 아니라 브라우저에 저장되기 때문에, 기기를
        바꾸거나 브라우저 데이터(쿠키·사이트 데이터)를 지우면 응시 기록과 오답노트가 초기화돼요.
      </>
    ),
  },
  {
    q: '창을 닫아도 이어서 풀 수 있나요?',
    k: '이어풀기 중단 나갔다 타이머 시간',
    a: (
      <>
        네. 다시 들어오면 <B>&lsquo;이어서 풀기&rsquo;</B> 안내가 떠요. 창을 닫아 둔 동안에는 시간이 흐르지 않아서 남은 시간
        그대로 다시 시작돼요. 이어 풀 수 있는 시험은 한 번에 하나이고, &lsquo;오답 다시 풀기&rsquo;는 이어 풀기가 되지 않아요.
      </>
    ),
  },
  {
    q: '오답노트는 어떻게 쌓이나요?',
    k: '오답 틀린 문제 영역별 약점 복습',
    a: (
      <>
        교시를 제출해 채점되면 <B>틀리거나 비워 둔 문항이 자동으로</B> 오답노트에 담겨요. 회차가 달라도 계속 쌓이고,
        다시 풀어 맞히면 저절로 빠져요(&lsquo;빼기&rsquo;로 직접 뺄 수도 있어요). 세부 영역별 오답률 그래프에서 약한 영역을
        누르면 그 영역의 틀린 문제만 다시 풀 수 있어요.
      </>
    ),
  },
  {
    q: '해설은 어디서 보나요?',
    k: '해설 정답 풀이 상세해설 인쇄 PDF 출력',
    a: (
      <>
        교시를 제출하면 나오는 결과 화면에서 <B>&lsquo;틀린 문제만 보기&rsquo; 또는 &lsquo;전체 해설 보기&rsquo;</B>를 누르고,
        문항마다 &lsquo;상세해설 보기&rsquo;를 누르면 돼요. 오답노트의 각 문항에서도 &lsquo;해설 보기&rsquo;로 볼 수 있어요.
        해설은 앱 화면에서만 제공돼요(인쇄·PDF 저장 미지원).
      </>
    ),
  },
  {
    q: '쿠폰은 어떻게 적용하나요?',
    k: '쿠폰 할인 코드 적용 안 됨',
    a: (
      <>
        결제 화면의 <B>쿠폰 칸에 코드를 넣고 적용</B>하면 할인된 금액이 바로 보여요. 쿠폰은 모의 CBT 이용권에만 쓸 수 있고
        한 번 쓰면 끝나요. 결제가 실패하면 쿠폰은 다시 쓸 수 있는 상태로 돌아가요.
      </>
    ),
  },
  {
    q: '재도전 1년 무료연장은 어떻게 신청하나요?',
    k: '불합격 떨어짐 연장 재시험 내년 1년',
    a: (
      <>
        이번 시험에서 원하는 결과를 얻지 못했다면 합격자 발표일(12월 23일)부터 <B>1월 23일까지</B> 신청해 주세요.
        <ul className="mt-2 flex flex-col gap-1 list-disc pl-5">
          <li>대상: 시험 응시 전에 이용권을 구매한 분</li>
          <li>인증: 국시원 시험 결과 화면 캡처</li>
          <li>
            신청: <A href={KAKAO}>고객센터</A>(사이트 오른쪽 위 메뉴 또는 오른쪽 아래 상담 버튼)로 캡처와 로그인 계정을 보내 주세요
          </li>
        </ul>
        <span className="block mt-2">확인 후 이용기간을 1년 연장해 드려요(1회).</span>
      </>
    ),
  },
  {
    q: '결제했는데 이용이 안 돼요.',
    k: '결제 오류 안 열림 무통장 입금 계좌이체 주문번호 환불',
    a: (
      <ol className="flex flex-col gap-1 list-decimal pl-5">
        <li>구매한 계정과 지금 로그인한 계정이 같은지 먼저 확인해 주세요.</li>
        <li>무통장입금은 입금이 확인된 뒤에 열려요.</li>
        <li>
          그래도 안 되면 <B>다시 결제하지 마시고</B> 주문번호와 로그인 계정(구글/카카오, 이메일)을{' '}
          <A href={KAKAO}>고객센터</A>로 알려 주세요. 확인하는 대로 바로 열어 드려요.
        </li>
        <li>
          &lsquo;다른 기기에 등록된 계정이에요&rsquo;가 뜨면 위의 &lsquo;기기를 바꾸고 싶어요&rsquo; 답을 봐 주세요.
        </li>
      </ol>
    ),
  },
  {
    q: '오류가 생겼을 때 어떤 정보를 보내야 하나요?',
    k: '오류 버그 에러 문의 신고 문항 오류 제보',
    a: (
      <>
        <A href={KAKAO}>고객센터</A>로 아래 내용을 보내 주시면 빠르게 확인할 수 있어요.
        <ul className="mt-2 flex flex-col gap-1 list-disc pl-5">
          <li>로그인한 계정(구글/카카오, 이메일)</li>
          <li>기기와 브라우저(예: 맥북·크롬, 윈도우·엣지)</li>
          <li>문항 관련이면 급수·회차·교시·문항 번호</li>
          <li>언제, 무엇을 하다가 생겼는지</li>
          <li>오류 화면 캡처(문의용)</li>
          <li>결제 관련이면 주문번호</li>
        </ul>
      </>
    ),
  },
];

// 검색용 글자 — 답(JSX) 안의 글자를 모은다(링크·굵은 글씨 안쪽까지)
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join(' ');
  if (isValidElement(node)) return nodeText((node.props as { children?: ReactNode }).children);
  return '';
}

// standalone: /slp-cbt-practice/faq 처럼 FAQ만 단독으로 보여 줄 때(위 여백 추가)
export default function CbtFaq({ standalone = false }: { standalone?: boolean }) {
  const items = FAQ.map(({ q, k, a }) => ({ q, a, text: `${q} ${k ?? ''} ${nodeText(a)}` }));
  return (
    <section id="faq" className={`bg-parchment px-6 pb-14 ${standalone ? 'pt-10 md:pt-14 min-h-[70vh]' : ''}`}>
      <div className="max-w-[1120px] mx-auto">
        <div className="bg-white border-2 border-cbt-ink p-6 md:p-8">
          <h2 className="text-[21px] font-black mb-4">자주 묻는 질문</h2>
          <FaqList items={items} />
        </div>
      </div>
    </section>
  );
}
