// 서비스 제공기간(토스 심사 기준: 결제일로부터 최대 기간을 상세·결제 화면에 명시).
// 자료·한글놀이 이용권·강의는 6개월, CBT 연습앱 이용권만 3개월(2026-10-03).
export const SERVICE_PERIOD_MONTHS = 6;
export const SERVICE_PERIOD_LABEL = `결제일로부터 ${SERVICE_PERIOD_MONTHS}개월`;

export const CBT_PERIOD_MONTHS = 3;
export const CBT_PERIOD_LABEL = `결제일로부터 ${CBT_PERIOD_MONTHS}개월`;

const KST = 9 * 60 * 60 * 1000;

// 시작일(한국 날짜)에서 months개월 뒤 같은 날의 밤 23:59:59(한국 시각)까지 쓸 수 있다.
// 그달에 같은 날이 없으면 그달 말일까지(예: 11월 30일 + 3개월 → 2월 28일).
export function periodEnd(start: string | Date, months: number): Date {
  const kst = new Date(new Date(start).getTime() + KST);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const d = Math.min(kst.getUTCDate(), lastDay);
  return new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - KST);
}

// '2027년 1월 3일' (한국 날짜)
export function formatKoreanDate(date: Date): string {
  const kst = new Date(date.getTime() + KST);
  return `${kst.getUTCFullYear()}년 ${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`;
}
