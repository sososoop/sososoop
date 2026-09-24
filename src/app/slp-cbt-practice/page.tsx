import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { hasCbtEntitlement } from '@/lib/entitlements';
import LockedPreview, { type PreviewFeature, type PreviewShot } from '@/components/LockedPreview';
import DeviceGate from './DeviceGate';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '언어재활사 CBT 연습',
  description:
    '언어재활사 국가시험 CBT 형식을 그대로 재현한 온라인 모의 연습앱. 실제와 동일한 교시 구성·제한시간으로 풀고, 문항마다 해설을 확인합니다.',
};

const SHOTS: PreviewShot[] = [
  {
    src: '/images/preview/cbt-start.webp',
    label: '응시 정보 입력',
    caption:
      '실제 CBT처럼 급수·회차·교시를 고르고 입장합니다. 1급은 1·2회차, 2급은 1회차까지 준비돼 있고, 1·2교시 이어풀기도 실제 시험과 같은 구성이에요.',
  },
  {
    src: '/images/preview/cbt-exam.webp',
    label: '시험 화면',
    caption:
      '계산기·그림판·형광펜·메모·체크문제까지 실제 CBT 도구를 그대로 재현했습니다. 글자 크기와 화면 배치도 시험장과 같은 방식으로 조절해요.',
  },
  {
    src: '/images/preview/cbt-result-2.webp',
    label: '결과·해설',
    caption:
      '과목별 정답률과 과락 여부를 바로 확인하고, 틀린 문제만 모아 해설을 봅니다.',
  },
];

const FEATURES: PreviewFeature[] = [
  {
    title: '실제 CBT 화면 그대로',
    desc: '계산기·그림판·형광펜·메모·체크문제 등 시험장에서 쓰는 도구를 똑같이 재현했습니다. 시험 당일 화면이 낯설지 않아요.',
  },
  {
    title: '실제와 같은 교시·시간',
    desc: '교시 구성과 제한시간이 실제 필기시험과 동일합니다. 1교시를 마치면 이어서 2교시로 넘어갈 수 있어요.',
  },
  {
    title: '시험 정보를 첫 화면에',
    desc: '들어가면 올해 시험일정과 시험까지 남은 날짜, 1·2급 교시별 시간표, 합격 기준, 시험 당일 주의사항을 먼저 보여 드려요.',
  },
  {
    title: '과목별 채점과 과락 판정',
    desc: '총점 60%·과목별 40% 실제 합격 기준으로 채점해, 어느 과목이 위험한지 바로 보여줍니다.',
  },
  {
    title: '응시 기록과 과목별 추이',
    desc: '응시할 때마다 점수가 기록되고, 과목별 정답률 변화를 막대로 보여 줍니다. 과락 위험 과목도 알려 드려요.',
  },
  {
    title: '문항마다 상세 해설',
    desc: '틀린 문제만 모아 보거나 전체 해설을 한 문항씩 바로 확인할 수 있어요.',
  },
  {
    title: '쌓이는 오답노트',
    desc: '틀리거나 비워 둔 문제가 회차를 넘어 계속 모입니다. 틀린 문제만 다시 풀어서 맞히면 오답노트에서 빠져요.',
  },
  {
    title: '1급·2급 연습 문항',
    desc: '실제 시험의 과목 구성·문항 유형을 따른 창작 연습 문항으로, 문항은 계속 추가·업데이트됩니다.',
  },
  {
    title: '6개월 동안 무제한 응시',
    desc: '결제일로부터 6개월 동안 횟수 제한 없이 반복해서 응시할 수 있습니다. 기간 중 추가 결제가 없어요.',
  },
];

const NOTES = [
  '이용권을 구매한 소소숲 회원만 이용할 수 있습니다.',
  '이용기간은 결제일로부터 6개월이며, 기간 중 추가되는 문항도 그대로 이용할 수 있습니다.',
  '개인 학습용이라 계정당 사용 기기가 제한됩니다. 기기를 바꾸면 고객센터로 문의해 주세요.',
  '오답노트와 응시 기록은 이용하는 기기의 브라우저에 저장됩니다. 기기를 바꾸거나 브라우저 데이터를 지우면 초기화돼요.',
  '문항과 해설은 앱 화면에서만 볼 수 있으며 인쇄·PDF 저장은 지원하지 않습니다. 캡처·공유 등 무단 복제·배포는 이용약관에 따라 금지됩니다.',
  '실제 기출문제가 아닌 창작 연습 문항으로 구성되어 있습니다.',
  '본 서비스는 한국보건의료인국가시험원(국시원)과 무관한 개인 학습용 연습 도구입니다.',
];

export default async function CbtPracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비로그인 / 미결제 → 로그인 폼 대신 소개 + 미리보기 화면을 보여준다.
  // (앱 HTML을 내려주는 /slp-cbt-practice/app 라우트가 실제 게이트를 다시 확인한다)
  // 관리자 계정은 이용권 없이 통과(기기 제한도 bind·app 라우트에서 건너뜀).
  const entitled = user ? isAdmin(user) || (await hasCbtEntitlement(user.id)) : false;
  if (!entitled) {
    return (
      <LockedPreview
        state={user ? 'unpaid' : 'anonymous'}
        eyebrow="국가시험 대비"
        title="언어재활사 CBT 연습"
        tagline="실제 시험과 동일한 교시 구성·제한시간·화면으로 연습하고, 문항마다 상세한 해설로 복습하는 온라인 모의 CBT입니다."
        intro={
          user
            ? '실제 화면입니다. 이용권을 구매하면 아래 화면을 그대로 사용할 수 있어요.'
            : '실제 화면입니다. 구매 후 로그인하면 아래 화면을 그대로 사용할 수 있어요.'
        }
        shots={SHOTS}
        features={FEATURES}
        notes={NOTES}
        checkoutHref="/checkout?product=cbt"
        loginHref="/login?next=/slp-cbt-practice"
      />
    );
  }

  // 결제 확인됨 — 기기 바인딩 후 앱 표시
  return <DeviceGate />;
}
