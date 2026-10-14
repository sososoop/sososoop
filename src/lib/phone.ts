// 휴대폰 번호 정리: 숫자만 남겨 01X로 시작하는 10~11자리인지 보고 010-1234-5678 꼴로 돌려준다. 아니면 null.
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!/^01[0-9]{8,9}$/.test(digits)) return null;
  return digits.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
}

export const PHONE_ERROR = '휴대폰 번호를 다시 확인해 주세요. (예: 010-1234-5678)';
