// 유료 자료 파일 목록 — 서버 전용.
// 파일은 Supabase Storage 비공개 저장소(paid-files)에 있고, 공개 주소가 없다.
// 마이페이지 다운로드 라우트가 구매·기간을 확인한 뒤 60초짜리 서명 링크로만 내려준다.
// 새 유료 PDF를 팔 때: 저장소에 올리고(영문 파일 경로) 여기에 상품 id → 파일을 한 줄 추가한다.
import { periodEnd, SERVICE_PERIOD_MONTHS } from '@/lib/period';

export const PAID_FILES_BUCKET = 'paid-files';

export type PaidFile = {
  key: string; // 저장소 안 경로
  label: string; // 마이페이지 버튼 이름
  downloadName: string; // 받았을 때 파일 이름
};

const AI_PROMPT_PACK: PaidFile[] = [
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
];

// 결제 상품 id(Notion 페이지 id, 폴백 데이터 id) → 파일들
const PAID_FILES: Record<string, PaidFile[]> = {
  '38a4332f-6595-8124-b189-c82e8152c24c': AI_PROMPT_PACK,
  'ai-prompt-100-pack': AI_PROMPT_PACK,
};

export function paidFilesFor(productId: string): PaidFile[] {
  return PAID_FILES[productId] ?? [];
}

// 결제일부터 이용기간(6개월) 동안 다시 받을 수 있다.
export function downloadUntil(paidAt: string): Date {
  return periodEnd(paidAt, SERVICE_PERIOD_MONTHS);
}
