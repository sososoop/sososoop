import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { hasHangulEntitlement } from '@/lib/entitlements';
import { getCartItem } from '@/lib/products';
import LockedPreview, { type PreviewFeature, type PreviewShot } from '@/components/LockedPreview';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '한글놀이',
  description:
    '난독·읽기부진 아동을 위한 한글 블렌딩 학습 도구. 배운 음소만 켜서 글자를 만들고, 놀이·게임·학습자료 제작까지 한 화면에서.',
};

const SHOTS: PreviewShot[] = [
  {
    src: '/images/preview/hangul-progress.webp',
    label: '진도 설정',
    caption:
      '아동이 배운 초성·중성·종성만 켜두면, 놀이·게임·자료 만들기가 전부 그 음소 안에서만 돌아갑니다. 아동별 프로필로 진도를 따로 관리할 수 있어요.',
  },
  {
    src: '/images/preview/hangul-blending.webp',
    label: '블렌딩 보드',
    caption:
      '초성·중성·종성을 하나씩 눌러 글자를 조합합니다. 아이가 직접 소리를 합쳐보며 글자가 만들어지는 과정을 눈으로 확인해요.',
  },
  {
    src: '/images/preview/hangul-game.webp',
    label: '타자 게임',
    caption:
      '벽돌깨기·글자잡기 두 가지 게임. 진도에서 켠 음소로 만든 글자만 나오니, 놀이처럼 읽어도 연습 범위를 벗어나지 않습니다.',
  },
  {
    src: '/images/preview/hangul-generator.webp',
    label: '자료 만들기',
    caption:
      '조건만 정하면 의미 단어·무의미 단어·문장 목록이 자동 생성됩니다. 그대로 인쇄하거나 글씨연습장으로 이어서 만들 수 있어요.',
  },
];

const FEATURES: PreviewFeature[] = [
  {
    title: '배운 음소만 딱',
    desc: '오늘 배운 음소만 켜두면 모든 활동이 그 범위 안에서만 나옵니다. 아직 안 배운 글자로 아이가 좌절할 일이 없어요.',
  },
  {
    title: '블렌딩 보드',
    desc: 'UFLI 블렌딩 보드 방식으로 초성·중성·종성을 눌러 글자를 만듭니다. 소리를 합치는 과정을 직접 조작하며 익혀요.',
  },
  {
    title: '읽기 게임 2종',
    desc: '벽돌깨기와 글자잡기. 시간 제한이 없어 천천히 소리 내어 읽으며 할 수 있습니다.',
  },
  {
    title: '학습자료 자동 생성',
    desc: '의미 단어·무의미 단어·문장을 조건대로 뽑아 바로 인쇄. 글씨연습장 생성기로도 이어집니다.',
  },
  {
    title: '아동별 프로필',
    desc: '아동마다 진도를 따로 저장하고, 내보내기·가져오기로 기기를 옮겨도 그대로 이어서 쓸 수 있어요.',
  },
  {
    title: '가정과제 링크',
    desc: '오늘 진도 그대로 담긴 링크를 보호자에게 보내면, 집에서도 같은 범위로 연습합니다.',
  },
];

const NOTES = [
  '이용권을 구매한 소소숲 회원만 이용할 수 있습니다.',
  '이용기간은 결제일로부터 6개월입니다.',
  'PC·태블릿·스마트폰 모두 브라우저에서 바로 실행되며, 설치할 프로그램이 없습니다.',
  '아동 이름·진도는 서버가 아니라 사용하는 기기에만 저장됩니다.',
  '이용기간 중 기능이 추가·개선되어도 추가 비용은 없습니다.',
];

export default async function HangulPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비로그인 / 미결제 → 로그인 폼 대신 소개 + 미리보기 화면을 보여준다.
  // (앱 HTML을 내려주는 /hangul/app 라우트가 실제 게이트를 다시 확인한다)
  // 관리자 계정은 이용권 없이 통과.
  const entitled = user ? isAdmin(user) || (await hasHangulEntitlement(user.id)) : false;
  if (!entitled) {
    return (
      <LockedPreview
        state={user ? 'unpaid' : 'anonymous'}
        eyebrow="한글 학습 도구"
        title="한글놀이"
        tagline="난독·읽기부진 아동을 위한 한글 블렌딩 학습 도구. 오늘 배운 음소만 켜두면 놀이도, 게임도, 학습지도 그 범위 안에서 만들어집니다."
        intro={
          user
            ? '실제 화면입니다. 이용권을 구매하면 아래 화면을 그대로 사용할 수 있어요.'
            : '실제 화면입니다. 구매 후 로그인하면 아래 화면을 그대로 사용할 수 있어요.'
        }
        shots={SHOTS}
        features={FEATURES}
        notes={NOTES}
        checkoutHref="/checkout?product=hangul"
        cartItem={await getCartItem('hangul')}
        loginHref="/login?next=/hangul"
      />
    );
  }

  return (
    // 소소숲 헤더(높이 2.75rem) 아래를 꽉 채워 앱을 담는다.
    <div className="w-full" style={{ height: 'calc(100dvh - 2.75rem)' }}>
      <iframe
        src="/hangul/app"
        title="한글놀이"
        className="block w-full h-full border-0"
        allow="fullscreen; clipboard-write"
      />
    </div>
  );
}
