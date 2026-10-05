// 유료 자료 파일 목록 — 서버 전용.
// 파일은 Supabase Storage 비공개 저장소(paid-files)에 있고, 공개 주소가 없다.
// 마이페이지 다운로드 라우트가 구매·기간을 확인한 뒤 60초짜리 서명 링크로만 내려준다.
// 새 유료 PDF를 팔 때: 저장소에 올리고(영문 파일 경로) 여기에 상품 id → 파일을 한 줄 추가한다.
import { periodEnd, CBT_PERIOD_MONTHS, SERVICE_PERIOD_MONTHS } from '@/lib/period';

export const PAID_FILES_BUCKET = 'paid-files';

export type PaidFile = {
  key: string; // 저장소 안 경로
  label: string; // 마이페이지 버튼 이름
  downloadName: string; // 받았을 때 파일 이름
};

type PaidFileSet = {
  files: PaidFile[];
  months: number; // 결제일부터 다시 받을 수 있는 기간
};

const AI_PROMPT_PACK: PaidFileSet = {
  months: SERVICE_PERIOD_MONTHS,
  files: [
    {
      key: 'ai-prompt-pack/prompt-100.pdf',
      label: 'AI 활용 프롬프트 100',
      downloadName: '언어치료·특수교육 AI 활용 프롬프트 100_소소숲.pdf',
    },
    {
      key: 'ai-prompt-pack/source-sites-v2.pdf',
      label: '치료 자료 소스 사이트 모음',
      downloadName: '치료 자료 소스 사이트 모음_소소숲.pdf',
    },
    {
      key: 'ai-prompt-pack/canva-keywords.pdf',
      label: '캔바 요소 키워드 모음',
      downloadName: '캔바 요소 키워드_소소숲.pdf',
    },
  ],
};

// 모의 CBT 이용권 구매자 선물 — 이용기간(3개월) 동안 받을 수 있다.
const CBT_GIFT: PaidFileSet = {
  months: CBT_PERIOD_MONTHS,
  files: [
    {
      key: 'cbt-gift/gichul-1-14-deluxe.pdf',
      label: '1급 14회 기출유형분석 심화판',
      downloadName: '제14회_1급_언어재활사_국시_기출유형분석_심화판_소소숲.pdf',
    },
  ],
};

// 결제 상품 id(Notion 페이지 id, 별칭, 폴백 데이터 id) → 파일들
const PAID_FILES: Record<string, PaidFileSet> = {
  '38a4332f-6595-8124-b189-c82e8152c24c': AI_PROMPT_PACK,
  'ai-prompt-100-pack': AI_PROMPT_PACK,
  '3bd4332f-6595-81dc-b286-ef782b37505e': CBT_GIFT,
  'cbt-practice-pass': CBT_GIFT,
  cbt: CBT_GIFT,
};

export function paidFilesFor(productId: string): PaidFile[] {
  return PAID_FILES[productId]?.files ?? [];
}

// 결제일부터 상품별 기간 동안 다시 받을 수 있다.
export function downloadUntil(productId: string, paidAt: string): Date {
  return periodEnd(paidAt, PAID_FILES[productId]?.months ?? SERVICE_PERIOD_MONTHS);
}
