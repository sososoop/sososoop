// 모의 CBT 자주 묻는 질문 단독 페이지 — 앱 첫 화면의 '자주 묻는 질문' 버튼이 새 탭으로 연다.
// 이용권 없이도 볼 수 있다(소개 화면 아래 FAQ와 같은 내용).
import type { Metadata } from 'next';
import CbtFaq from '@/components/cbt/CbtFaq';

export const metadata: Metadata = {
  title: '모의 CBT 자주 묻는 질문',
  description: '언어재활사 모의 CBT 로그인·이용기간·이어 풀기·오답노트·해설·쿠폰·재도전 연장 안내.',
};

export default function CbtFaqPage() {
  return (
    <div className="text-cbt-ink">
      <CbtFaq standalone />
    </div>
  );
}
