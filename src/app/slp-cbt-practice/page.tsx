import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getCbtEntitlement } from '@/lib/entitlements';
import { CBT_PERIOD_LABEL, CBT_PERIOD_MONTHS, formatKoreanDate, periodEnd } from '@/lib/period';
import { getCartItem } from '@/lib/products';
import CbtLanding from '@/components/cbt/CbtLanding';
import DeviceGate from './DeviceGate';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '언어재활사 CBT 연습',
  description:
    '언어재활사 국가시험과 같은 교시 구성·제한시간으로 연습하는 온라인 모의 CBT. 1급 3회분·2급 2회분 총 720문항, 상세해설과 쌓이는 오답노트.',
};

const NOTES = [
  '이용권을 구매한 소소숲 회원만 이용할 수 있습니다.',
  `이용기간은 ${CBT_PERIOD_LABEL}이며, 기간 중 추가되는 문항도 그대로 이용할 수 있습니다. 기간이 끝나면 이용권을 다시 구매해 이어서 쓸 수 있어요.`,
  '구매 선물로 제14회(2025) 1급·2급 기출유형분석 심화판 PDF를 드려요. 이용기간 동안 마이페이지에서 받을 수 있습니다.',
  '개인 학습용이라 계정당 사용 기기가 제한됩니다. 기기를 바꾸면 고객센터로 문의해 주세요.',
  '오답노트와 응시 기록은 이용하는 기기의 브라우저에 저장됩니다. 기기를 바꾸거나 브라우저 데이터를 지우면 초기화돼요.',
  '문항과 해설은 앱 화면에서만 볼 수 있으며 인쇄·PDF 저장은 지원하지 않습니다. 캡처·공유 등 무단 복제·배포는 이용약관에 따라 금지됩니다.',
  '실제 기출문제가 아닌 창작 연습 문항으로 구성되어 있습니다.',
  '본 서비스는 한국보건의료인국가시험원(국시원)과 무관한 개인 학습용 연습 도구입니다.',
];

// 관리자 미리보기용 예시 날짜 — 어제 끝남 / 오늘 결제했다면 끝나는 날
function previewDates() {
  const now = Date.now();
  return {
    previewExpiredOn: formatKoreanDate(new Date(now - 86400000)),
    previewActiveUntil: formatKoreanDate(periodEnd(new Date(now), CBT_PERIOD_MONTHS)),
  };
}

export default async function CbtPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비로그인 / 미결제 → 로그인 폼 대신 소개 + 미리보기 화면을 보여준다.
  // (앱 HTML을 내려주는 /slp-cbt-practice/app 라우트가 실제 게이트를 다시 확인한다)
  // 관리자 계정은 이용권 없이 통과(기기 제한도 bind·app 라우트에서 건너뜀).
  // 이용권은 결제일(지급일)부터 3개월 — 끝났으면 끝난 날을 알려 주고 다시 구매하게 한다.
  const adminUser = user ? isAdmin(user) : false;
  const access = user && !adminUser ? await getCbtEntitlement(user.id) : null;

  // 관리자 전용 화면 미리보기(?preview=expired · ?preview=active). 날짜는 예시 값.
  // 관리자가 아니면 무시한다 → 이용권 검사를 우회하는 통로가 되지 않는다.
  const previewMode = adminUser && (preview === 'expired' || preview === 'active') ? preview : null;
  const { previewExpiredOn, previewActiveUntil } = previewDates();

  const entitled = previewMode === 'expired' ? false : adminUser || !!access?.ok;
  if (!entitled) {
    const expiredOn =
      previewMode === 'expired'
        ? previewExpiredOn
        : access?.expiresAt
          ? formatKoreanDate(access.expiresAt)
          : undefined;
    return (
      <CbtLanding
        state={!user ? 'anonymous' : expiredOn ? 'expired' : 'unpaid'}
        expiredOn={expiredOn}
        periodLabel={CBT_PERIOD_LABEL}
        perk="구매하면 제14회(2025) 1급·2급 기출유형분석 심화판 PDF를 선물로 드려요."
        notes={NOTES}
        checkoutHref="/checkout?product=cbt"
        cartItem={await getCartItem('cbt')}
        loginHref="/login?next=/slp-cbt-practice"
      />
    );
  }

  // 결제 확인됨 — 기기 바인딩 후 앱 표시
  const expiresOn =
    previewMode === 'active'
      ? previewActiveUntil
      : access?.expiresAt
        ? formatKoreanDate(access.expiresAt)
        : null;
  return <DeviceGate expiresOn={expiresOn} />;
}
