import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { hasHangulEntitlement } from '@/lib/entitlements';
import { getCartItem } from '@/lib/products';
import HangulLanding, { type HangulPlan } from '@/components/hangul/HangulLanding';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '한글놀이',
  description:
    '난독·읽기부진 아동을 위한 한글 해독 학습 도구. 배운 음소만 켜 두면 블렌딩 보드·읽기 게임·집중 음소 단어·헷갈리는 짝·사전 예문 문장까지 그 범위 안에서.',
};

const NOTES = [
  '이용권을 구매한 소소숲 회원만 이용할 수 있습니다.',
  '이용기간은 결제일로부터 6개월 또는 12개월입니다(고른 이용권 기준).',
  '이용 중에 다시 구매하면 새 결제일부터 기간을 다시 셉니다. 남은 기간과 합쳐지지 않으니 끝날 즈음 구매해 주세요.',
  'PC·태블릿·스마트폰 모두 브라우저에서 바로 실행되며, 설치할 프로그램이 없습니다.',
  '아동 이름·진도는 서버가 아니라 사용하는 기기에만 저장됩니다.',
  '이용기간 중 기능이 추가·개선되어도 추가 비용은 없습니다.',
];

// 이용권 옵션(2026-10-17~): 6개월 · 12개월. 결제 가격은 Notion 상품에서 읽는다.
// 정상 판매가 — Notion 가격이 이보다 낮으면 '첫 출시 특별가'로 정상가에 줄을 그어 보여 준다.
// 특별가를 끝낼 때는 Notion 가격을 정상가로 바꾸면 표시도 저절로 사라진다.
const LIST_PRICE: Record<number, number> = { 6: 19900, 12: 29900 };

async function hangulPlans(): Promise<HangulPlan[]> {
  const [six, twelve] = await Promise.all([getCartItem('hangul'), getCartItem('hangul12')]);
  const plans: HangulPlan[] = [];
  if (six) plans.push({ months: 6, checkoutHref: '/checkout?product=hangul', cartItem: six, listPrice: LIST_PRICE[6] });
  if (twelve) plans.push({ months: 12, checkoutHref: '/checkout?product=hangul12', cartItem: twelve, listPrice: LIST_PRICE[12] });
  return plans;
}

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
      <HangulLanding
        state={user ? 'unpaid' : 'anonymous'}
        plans={await hangulPlans()}
        notes={NOTES}
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
