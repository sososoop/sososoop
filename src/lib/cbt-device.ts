// 모의 CBT 기기 등록(1계정 = 1기기) — bind·move 라우트, 마이페이지, 관리자가 같이 쓴다.
// 기기 확인은 서버가 만든 번호를 httpOnly 쿠키(slp_cbt_dev)에 두고 cbt_access.device_id 와 비교한다.
// 회원이 '다른 기기' 화면에서 직접 옮길 수 있고(2026-10-15), 옮긴 날부터 14일 동안은 다시 못 옮긴다.
import type { NextResponse } from 'next/server';

export const CBT_DEVICE_COOKIE = 'slp_cbt_dev';
export const DEVICE_TOKEN_PREFIX = 't_'; // 서버가 만든 번호. 이게 아니면 예전 방식(브라우저가 만든 기기 ID)이다.
export const DEVICE_MOVE_DAYS = 14;

const KST = 9 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

export function newDeviceToken() {
  return DEVICE_TOKEN_PREFIX + crypto.randomUUID().replace(/-/g, '');
}

export function setDeviceCookie(res: NextResponse, token: string) {
  res.cookies.set(CBT_DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/slp-cbt-practice',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

// 다음에 직접 옮길 수 있는 때. 옮긴 날(한국 날짜)부터 14일 뒤 0시(한국 시각).
// 날짜로 안내하니 시각까지 따지지 않는다(10월 14일 오후에 옮겼으면 10월 28일 0시부터).
// null = 지금 옮길 수 있음(아직 옮긴 적 없거나 14일이 지남).
export function nextDeviceMoveAt(movedAt: string | null | undefined, now = Date.now()): Date | null {
  if (!movedAt) return null;
  const kstDayStart = Math.floor((new Date(movedAt).getTime() + KST) / DAY) * DAY - KST;
  const next = kstDayStart + DEVICE_MOVE_DAYS * DAY;
  return next > now ? new Date(next) : null;
}
