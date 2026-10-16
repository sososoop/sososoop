// /hangul 의 공개 소개 화면(비로그인·미결제) — 모의 CBT 상세페이지(CbtLanding)와 같은 짜임.
// 색은 한글놀이 앱과 같게(라임·파랑·먹색, 초성 하늘·종성 살구).
// 영상은 실제 앱을 녹화해 화면 부분만 잘라 만든 클립(public/videos/hangul).

import Link from 'next/link';
import type { ReactNode } from 'react';
import AddToCartButton from '@/components/AddToCartButton';
import AutoVideo from '@/components/cbt/AutoVideo';
import type { CartItem } from '@/lib/cart';

const C = {
  ink: '#141414',
  lime: '#EAFF3D',
  limeSoft: '#F2FF8F',
  blue: '#5B6EF5',
  blueDark: '#4152d9',
  cho: '#BFE3FF',
  jong: '#FFD6A5',
  gray: '#6b7280',
};

// 클립 크기(px) — 녹화 후 자른 크기
const CLIPS = {
  blend: { name: 'hangul-blend', w: 980, h: 965 },
  prog: { name: 'hangul-prog', w: 980, h: 880 },
  game: { name: 'hangul-game', w: 980, h: 815 },
  words: { name: 'hangul-words', w: 980, h: 900 },
  pairs: { name: 'hangul-pairs', w: 980, h: 900 },
  sent: { name: 'hangul-sent', w: 980, h: 900 },
} as const;
type Clip = (typeof CLIPS)[keyof typeof CLIPS];

type Props = {
  state: 'anonymous' | 'unpaid';
  periodLabel: string;
  notes: string[];
  checkoutHref: string;
  cartItem?: CartItem | null;
  loginHref: string;
};

const BTN =
  'inline-flex items-center justify-center px-6 py-3 border-2 border-[#141414] text-[16px] font-black transition-colors active:translate-x-[2px] active:translate-y-[2px]';
const SH = (c = C.ink, n = 8) => ({ boxShadow: `${n}px ${n}px 0 0 ${c}` });

const Em = ({ children }: { children: ReactNode }) => <span style={{ color: C.blue }}>{children}</span>;

// 자모 타일(앱의 버튼 모양) — 표지 장식·칩에 쓴다
function Jamo({ ch, bg, size = 44 }: { ch: string; bg: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center border-2 border-[#141414] font-black leading-none"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.5, boxShadow: '3px 3px 0 0 #141414' }}
    >
      {ch}
    </span>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex border-2 border-[#141414] bg-white text-[14px] md:text-[15px] font-extrabold">
      <span className="px-3 py-1.5 border-r-2 border-[#141414]" style={{ background: C.lime }}>
        한글놀이
      </span>
      <span className="px-3 py-1.5">{children}</span>
    </span>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((b, i) => (
        <li key={i} className="flex gap-3 items-start text-[17px] md:text-[18px] font-bold leading-[1.5] [word-break:keep-all]">
          <span
            className="flex-none mt-[2px] w-7 h-7 border-2 border-[#141414] text-[14px] font-black flex items-center justify-center text-white"
            style={{ background: C.blue }}
          >
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
  shadow = C.blue,
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
  shadow?: string;
}) {
  return (
    <section className="px-6 py-14 md:py-20 border-t-2 border-[#141414]/10">
      <div className="max-w-[1120px] mx-auto grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-8 lg:gap-14 items-center">
        <div className={flip ? 'lg:order-2' : ''}>
          <Chip>{label}</Chip>
          <h2 className="mt-5 mb-7 tracking-tight [word-break:keep-all]">
            <span className="block text-[20px] md:text-[24px] font-bold text-[#4a4a46]">{l1}</span>
            <span className="block mt-1 text-[32px] md:text-[42px] font-black leading-[1.18]">{l2}</span>
          </h2>
          <Bullets items={bullets} />
          {punch && (
            <p className="mt-7 text-[20px] md:text-[22px] font-black">
              <span className="hg-mark">{punch}</span>
            </p>
          )}
          {note && <p className="mt-5 text-[13px] leading-relaxed [word-break:keep-all]" style={{ color: C.gray }}>{note}</p>}
        </div>
        <div className={flip ? 'lg:order-1' : ''}>
          <div className="border-2 border-[#141414] bg-white" style={SH(shadow, 10)}>
            <AutoVideo dir="hangul" name={clip.name} width={clip.w} height={clip.h} alt={alt} />
          </div>
        </div>
      </div>
    </section>
  );
}

const PAINS = [
  '학습지를 만들 때마다 아직 안 배운 글자를 하나하나 빼느라 시간이 걸려요.',
  'ㅋ·ㅌ·ㅍ처럼 헷갈려 하는 소리만 모아서 연습시키고 싶은데, 단어 찾기가 어려워요.',
  '단어는 읽는데, 같은 소리로 된 문장까지 이어 줄 자료가 마땅치 않아요.',
  '수업에서 한 걸 집에서도 같은 범위로 연습하게 하고 싶어요.',
];

const STILLS = [
  {
    src: '/images/preview/hangul-hand.webp',
    label: '글씨연습장으로 바로',
    caption: '만든 단어 목록을 누르면 A4 따라쓰기 연습장이 열려요. 칸 수·글꼴·안내선을 고르고 바로 인쇄.',
  },
  {
    src: '/images/preview/hangul-hw.webp',
    label: '가정과제 링크',
    caption: '오늘 진도 그대로 잠긴 링크를 보호자에게 보내면, 집에서도 같은 범위로 연습해요. 아동 이름은 담기지 않아요.',
  },
  {
    src: '/images/preview/hangul-progress.webp',
    label: '아동별 프로필',
    caption: '아동마다 진도를 따로 저장하고, 내보내기·가져오기로 기기를 옮겨도 그대로 이어서 써요.',
  },
];

export default function HangulLanding({ state, periodLabel, notes, checkoutHref, cartItem, loginHref }: Props) {
  const price = cartItem?.price ? `${cartItem.price.toLocaleString()}원` : null;
  const cart = (extra = '') =>
    cartItem ? <AddToCartButton item={cartItem} className={`${BTN} bg-white hover:bg-[#F2FF8F] ${extra}`} /> : null;

  return (
    <div className="text-[#141414]">
      {/* 표지 */}
      <section className="hg-grid px-6 pt-12 pb-14 md:pt-16 md:pb-20 border-b-2 border-[#141414]">
        <div className="max-w-[1120px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-10 lg:gap-14 items-center">
          <div>
            <p className="inline-flex flex-wrap border-2 border-[#141414] bg-white text-[14px] md:text-[15px] font-extrabold">
              <span className="text-white px-3 py-1.5 border-r-2 border-[#141414]" style={{ background: C.blue }}>
                난독 · 읽기부진 아동
              </span>
              <span className="px-3 py-1.5">해독 학습 도구</span>
            </p>
            <h1 className="mt-6 tracking-tight [word-break:keep-all]">
              <span className="block text-[26px] md:text-[32px] font-extrabold">아직 안 배운 글자 때문에</span>
              <span className="block mt-1 text-[44px] md:text-[60px] font-black leading-[1.1]">
                <span className="hg-mark">막히지 않게.</span>
              </span>
            </h1>
            <p className="mt-6 text-[18px] md:text-[20px] font-bold leading-[1.6] [word-break:keep-all]">
              오늘 배운 음소만 켜 두면
              <br />
              <Em>놀이 · 게임 · 학습지</Em>가 전부 그 범위 안에서 만들어져요.
            </p>
            <div className="mt-6 flex items-center gap-2" aria-hidden>
              <Jamo ch="ㄱ" bg={C.cho} />
              <span className="text-[22px] font-black">+</span>
              <Jamo ch="ㅏ" bg={C.lime} />
              <span className="text-[22px] font-black">+</span>
              <Jamo ch="ㅁ" bg={C.jong} />
              <span className="text-[22px] font-black">=</span>
              <Jamo ch="감" bg="#fff" size={56} />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={checkoutHref} className={`${BTN} text-white`} style={{ background: C.blue }}>
                이용권 구매하기{price ? ` · ${price}` : ''}
              </Link>
              {cart()}
            </div>
            {state === 'anonymous' && (
              <Link href={loginHref} className="inline-block mt-4 text-[14px] font-bold underline" style={{ color: C.gray }}>
                이미 구매했어요 · 로그인
              </Link>
            )}
            <p className="mt-4 text-[13px]" style={{ color: C.gray }}>
              이용권 구매 후 이용할 수 있는 유료 서비스예요 · 이용기간 {periodLabel} · 설치 없이 브라우저에서
            </p>
          </div>
          <div>
            <div className="border-2 border-[#141414] bg-white" style={SH(C.ink, 12)}>
              <AutoVideo
                dir="hangul"
                name={CLIPS.blend.name}
                width={CLIPS.blend.w}
                height={CLIPS.blend.h}
                alt="블렌딩 보드에서 ㄱ·ㅏ·ㅁ을 눌러 '감', 이어서 '자'를 만들어 '감자'를 담는 화면"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 이런 선생님께 */}
      <section className="px-6 py-14 md:py-20" style={{ background: C.ink }}>
        <div className="max-w-[1120px] mx-auto">
          <h2 className="text-white tracking-tight [word-break:keep-all]">
            <span className="block text-[20px] md:text-[24px] font-bold text-white/70">해독 수업을 하면서</span>
            <span className="block mt-1 text-[30px] md:text-[40px] font-black leading-[1.2]">
              이런 적 있으셨죠?
            </span>
          </h2>
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            {PAINS.map((t) => (
              <p
                key={t}
                className="bg-white border-2 border-[#141414] p-5 text-[16px] md:text-[17px] font-bold leading-[1.6] [word-break:keep-all]"
                style={SH(C.lime, 6)}
              >
                “{t}”
              </p>
            ))}
          </div>
          <p className="mt-10 text-[22px] md:text-[28px] font-black text-white [word-break:keep-all]">
            한글놀이는 <span style={{ color: C.lime }}>진도 설정 한 번</span>으로 이걸 다 해결하려고 만들었어요.
          </p>
        </div>
      </section>

      <div className="hg-grid">
        <Feature
          label="진도 설정"
          l1="아이가 배운 음소만"
          l2={<><Em>딱 켜 두세요.</Em></>}
          clip={CLIPS.prog}
          alt="진도 설정에서 ㅋ·ㅌ·ㅍ과 ㅐ를 켜자 '지금 만들 수 있는 글자'가 바로 바뀌는 화면"
          bullets={[
            <>초성 · 중성 · 종성을 <Em>하나씩</Em> 켜고 끄기<span className="block text-[15px] font-semibold" style={{ color: C.gray }}>기본 자음 · 격음 · 경음 / 단모음 · 이중모음 / 대표 받침 · 겹받침</span></>,
            <>켜는 순간 <Em>지금 만들 수 있는 글자</Em>가 바로 바뀌어요</>,
            <>놀이 · 게임 · 자료 만들기가 <Em>모두 이 진도</Em>를 따라가요</>,
          ]}
          punch="한 번 정하면, 나머지는 알아서."
        />
        <Feature
          flip
          label="블렌딩 보드"
          l1="소리를 합치는 과정을"
          l2={<>눈으로 보고 <Em>손으로 익혀요.</Em></>}
          clip={CLIPS.blend}
          alt="블렌딩 보드에서 초성·중성·종성을 눌러 글자를 만들고 담기"
          shadow={C.ink}
          bullets={[
            <>초성 → 중성 → 종성을 눌러 <Em>글자가 만들어지는 과정</Em>을 직접</>,
            <>[다음 글자]로 이어 붙여 <Em>낱말까지</Em></>,
            <>담은 단어는 모아서 <Em>글씨연습장</Em>으로 바로</>,
          ]}
          note="※ UFLI 블렌딩 보드 방식을 한글 음절 구조에 맞게 옮겼어요. 기계 음성 없이, 소리 모델링은 선생님 목소리로 해 주세요."
        />
        <Feature
          label="읽기 게임"
          l1="놀이처럼 읽어도"
          l2={<>연습 범위는 <Em>그대로.</Em></>}
          clip={CLIPS.game}
          alt="벽돌깨기 게임에서 벽돌에 적힌 글자를 입력해 벽돌을 깨는 화면"
          bullets={[
            <><Em>벽돌깨기 · 글자잡기</Em> 두 가지 게임</>,
            <>한 글자 · 두 글자 · 세 글자로 <Em>단계 조절</Em></>,
            <>진도에서 켠 음소로 만든 글자만 나와요<span className="block text-[15px] font-semibold" style={{ color: C.gray }}>벽돌깨기는 시간 제한이 없어 천천히 소리 내어 읽으며 할 수 있어요</span></>,
          ]}
        />
        <Feature
          flip
          label="집중 음소"
          l1="헷갈려 하는 소리만"
          l2={<>골라서 <Em>집중 연습.</Em></>}
          clip={CLIPS.words}
          alt="집중 음소로 ㅋ·ㅌ·ㅍ을 고르고 생성하자 그 소리가 든 단어가 많이 든 순서로 나오는 화면"
          bullets={[
            <>ㅋ · ㅌ · ㅍ처럼 집중할 음소를 고르면 <Em>그 소리가 든 단어만</Em></>,
            <>그 소리가 <Em>많이 든 순서</Em>로, 해당 글자에 밑줄까지</>,
            <>첫소리 · 받침 · 어디든 — <Em>위치</Em>도 고를 수 있어요</>,
            <>국립국어원 <Em>사전에 실린 단어</Em>에서 뽑아요<span className="block text-[15px] font-semibold" style={{ color: C.gray }}>한국어기초사전 1~3음절 표제어 2만 8천여 개 + 표준국어대사전</span></>,
          ]}
          punch="단어 찾느라 쓰던 시간을, 아이에게."
        />
        <Feature
          label="헷갈리는 짝"
          l1="달 – 탈 – 딸,"
          l2={<><Em>한 소리만 다른</Em> 짝으로 변별해요.</>}
          clip={CLIPS.pairs}
          alt="헷갈리는 짝 생성 결과 — 발–팔–말, 불–풀–물 같은 한 소리만 다른 단어 묶음"
          bullets={[
            <>평음 · 격음 · 경음, ㄴ/ㄹ, ㅁ/ㅂ, ㅐ/ㅔ 등 <Em>헷갈리기 쉬운 소리</Em>끼리</>,
            <>한 소리만 다른 실제 단어를 <Em>자동으로 묶어</Em> 줘요</>,
            <>짝 단어도 <Em>진도 안의 글자</Em>만 써요</>,
          ]}
        />
        <Feature
          flip
          label="문장 만들기"
          l1="단어에서 문장까지,"
          l2={<><Em>같은 소리로</Em> 이어 가요.</>}
          clip={CLIPS.sent}
          alt="ㅋ·ㅌ·ㅍ이 든 사전 예문 문장이 생성된 화면"
          bullets={[
            <>사전 예문 <Em>41만 문장</Em>에서 진도 · 집중 음소에 맞는 문장만</>,
            <>문장 길이(3 · 5 · 8어절)와 <Em>진도 밖 글자 허용 수</Em>를 조절</>,
            <>목록 그대로 <Em>인쇄 · 복사</Em>하거나 글씨연습장으로</>,
          ]}
          note="※ 문장 출처: 국립국어원 「한국어기초사전」 예문(CC BY-SA 2.0 KR). 사전 예문이라 어색한 문장이 섞일 수 있어 인쇄 전 확인을 권해요."
        />

        {/* 수업 밖까지 */}
        <section className="px-6 py-14 md:py-20 border-t-2 border-[#141414]/10">
          <div className="max-w-[1120px] mx-auto">
            <Chip>수업 밖까지</Chip>
            <h2 className="mt-5 mb-8 tracking-tight [word-break:keep-all]">
              <span className="block text-[20px] md:text-[24px] font-bold text-[#4a4a46]">수업에서 한 그대로</span>
              <span className="block mt-1 text-[32px] md:text-[40px] font-black leading-[1.18]">쓰고, 들고 가고, <Em>집에서도.</Em></span>
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              {STILLS.map((s) => (
                <a key={s.src} href={s.src} target="_blank" rel="noopener noreferrer" className="group block bg-white border-2 border-[#141414]" style={SH(C.ink, 6)}>
                  <img src={s.src} alt={`한글놀이 ${s.label} 화면`} loading="lazy" className="block w-full aspect-[16/10] object-cover object-top border-b-2 border-[#141414]" />
                  <div className="p-4">
                    <p className="text-[16px] font-black">
                      {s.label} <span className="text-[13px] font-bold group-hover:underline" style={{ color: C.blue }}>크게 보기 ↗</span>
                    </p>
                    <p className="mt-1 text-[14px] font-medium leading-relaxed [word-break:keep-all]" style={{ color: C.gray }}>
                      {s.caption}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* 만든 사람 */}
        <section className="px-6 py-14 md:py-20 border-t-2 border-[#141414]/10">
          <div className="max-w-[880px] mx-auto text-center">
            <Chip>만든 사람</Chip>
            <h2 className="mt-5 tracking-tight [word-break:keep-all]">
              <span className="block text-[20px] md:text-[24px] font-bold text-[#4a4a46]">해독 수업을 직접 하는</span>
              <span className="block mt-1 text-[32px] md:text-[42px] font-black leading-[1.18]"><Em>언어재활사</Em>가 만들었어요.</span>
            </h2>
            <p className="mt-6 inline-flex flex-col sm:flex-row border-2 border-[#141414] bg-white text-[15px] md:text-[17px] font-extrabold">
              <span className="px-4 py-2 border-b-2 sm:border-b-0 sm:border-r-2 border-[#141414]" style={{ background: C.lime }}>1급 언어재활사</span>
              <span className="px-4 py-2">이승윤 · 소소숲 : 지혜의 기록소</span>
            </p>
            <p className="mt-6 text-[16px] md:text-[17px] font-bold leading-[1.7] [word-break:keep-all]" style={{ color: '#4a4a46' }}>
              아이 진도에 맞는 글자를 고르고, 단어를 찾고, 학습지를 만드는 일을 화면 하나로 모았어요.{' '}
              <br className="hidden md:block" />
              이용기간 중 추가 · 개선되는 기능은 추가 비용 없이 그대로 쓸 수 있어요.
            </p>
          </div>
        </section>
      </div>

      {/* 이용 안내 + 구매 카드 */}
      <section className="bg-parchment px-6 py-12 border-t-2 border-[#141414]">
        <div className="max-w-[1120px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
          <div className="bg-white border-2 border-[#141414] p-8">
            <h2 className="text-[21px] font-black mb-5">이용 안내</h2>
            <ul className="flex flex-col gap-3">
              {notes.map((n) => (
                <li key={n} className="flex items-start gap-2.5 text-[15px] text-ink-muted leading-relaxed">
                  <span className="font-black mt-0.5" style={{ color: C.blue }}>✓</span>
                  {n}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border-2 border-[#141414] p-8 text-center lg:sticky lg:top-6" style={SH(C.lime, 8)}>
            <p className="text-[16px] font-black mb-1">한글놀이 이용권</p>
            {price && <p className="text-[32px] font-black tracking-tight mb-2">{price}</p>}
            <p className="text-[14px] text-ink-muted leading-relaxed mb-6">
              {state === 'anonymous'
                ? '구매 후 소소숲 계정으로 로그인하면 이 페이지에서 바로 시작할 수 있어요.'
                : '이용권을 구매하면 이 페이지에서 바로 시작할 수 있어요.'}
            </p>
            <Link href={checkoutHref} className={`${BTN} w-full text-white`} style={{ background: C.blue }}>
              이용권 구매하기
            </Link>
            {cart('w-full mt-2.5')}
            <p className="mt-3 text-[12px] text-ink-light">이용기간: {periodLabel}</p>
            {state === 'anonymous' && (
              <Link href={loginHref} className="inline-block mt-4 text-[13px] font-bold underline" style={{ color: C.blue }}>
                이미 구매했어요 · 로그인
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
