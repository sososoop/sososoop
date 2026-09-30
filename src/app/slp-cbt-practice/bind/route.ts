// CBT 기기 바인딩/검증 — 로그인+결제 확인 후, 이 유저에 기기를 1대만 묶는다.
// 기기 확인은 서버가 만든 번호(토큰)를 httpOnly 쿠키(slp_cbt_dev)로만 한다.
// 들어올 때마다 새 번호로 바꾸고 옛 번호는 버린다(2026-09-30) → 번호를 복사해 다른 기기에 넣어도
// 원래 기기가 한 번 더 들어오면 복사본은 쓸 수 없게 된다. /app 라우트는 이 쿠키가 DB 번호와 같은지 본다.
// cbt_access.device_id 에 현재 번호를 둔다. bound_at(처음 등록한 때)은 바꾸지 않는다.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin';
import { hasCbtEntitlement } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

const COOKIE = 'slp_cbt_dev';
const TOKEN_PREFIX = 't_'; // 서버가 만든 번호. 이게 아니면 예전 방식(브라우저가 만든 기기 ID)이다.

function newToken() {
  return TOKEN_PREFIX + crypto.randomUUID().replace(/-/g, '');
}

function withCookie(token: string) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/slp-cbt-practice',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: 'auth' }, { status: 401 });

  // 관리자 계정은 기기를 등록하지 않는다 → 여러 기기에서 제한 없이 확인 가능.
  if (isAdmin(user)) return NextResponse.json({ ok: true });

  const entitled = await hasCbtEntitlement(user.id);
  if (!entitled) return NextResponse.json({ ok: false, reason: 'unpaid' }, { status: 403 });

  // 예전 방식으로 등록한 구매자를 옮기려고, 브라우저에 남은 옛 기기 ID도 받는다(한 번만 쓰인다).
  let legacyId = '';
  try {
    const body = (await request.json()) as { deviceId?: string };
    legacyId = String(body.deviceId ?? '').slice(0, 100);
  } catch {
    // no-op
  }
  const cookieToken = (await cookies()).get(COOKIE)?.value ?? '';

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });

  const { data: existing } = await admin
    .from('cbt_access')
    .select('device_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const token = newToken();

  if (!existing) {
    // 처음 들어옴 → 이 기기를 등록
    const { error } = await admin.from('cbt_access').insert({ user_id: user.id, device_id: token });
    if (error) return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });
    return withCookie(token);
  }

  const stored = existing.device_id as string;
  const sameDevice =
    (!!cookieToken && cookieToken === stored) ||
    // 예전 방식 번호는 쿠키나 브라우저 저장값으로 한 번 확인해 주고, 곧바로 새 번호로 바꾼다
    (!stored.startsWith(TOKEN_PREFIX) && !!legacyId && legacyId === stored);
  if (!sameDevice) return NextResponse.json({ ok: false, reason: 'device' }, { status: 409 });

  // 번호 바꾸기 — 방금 확인한 번호일 때만 바꾼다(그사이 다른 곳에서 바꿨으면 실패)
  const { data: rotated, error } = await admin
    .from('cbt_access')
    .update({ device_id: token })
    .eq('user_id', user.id)
    .eq('device_id', stored)
    .select('user_id');
  if (error) return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });
  if (!rotated || rotated.length === 0) {
    return NextResponse.json({ ok: false, reason: 'device' }, { status: 409 });
  }
  return withCookie(token);
}
