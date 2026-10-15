// CBT 기기 옮기기 — '다른 기기에 등록된 계정이에요' 화면의 [이 기기로 옮기기] (2026-10-15).
// 회원이 직접 지금 쓰는 브라우저를 등록 기기로 바꾼다. 이전 기기는 그 순간부터 열리지 않는다.
// 옮긴 날부터 14일 동안은 다시 못 옮긴다(계정을 나눠 쓰지 못하게) → 429와 다시 옮길 수 있는 날을 돌려준다.
// 처음 등록은 횟수에 치지 않는다(휴대폰으로 먼저 열었다가 PC로 옮기는 경우가 많았다).
// 14일 안에 꼭 바꿔야 하면 관리자가 [기기 초기화]로 풀어 준다(행을 지우므로 이 기록도 없어짐).
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin';
import { hasCbtEntitlement } from '@/lib/entitlements';
import { newDeviceToken, nextDeviceMoveAt, setDeviceCookie } from '@/lib/cbt-device';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: 'auth' }, { status: 401 });

  // 관리자 계정은 기기를 등록하지 않는다(bind 참고).
  if (isAdmin(user)) return NextResponse.json({ ok: true });

  const entitled = await hasCbtEntitlement(user.id);
  if (!entitled) return NextResponse.json({ ok: false, reason: 'unpaid' }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });

  const { data: existing, error: readError } = await admin
    .from('cbt_access')
    .select('device_id, moved_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (readError) return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });

  const token = newDeviceToken();

  if (!existing) {
    // 그사이 관리자가 초기화했다 → 처음 등록과 같다
    const { error } = await admin.from('cbt_access').insert({ user_id: user.id, device_id: token });
    if (error) return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });
    return setDeviceCookie(NextResponse.json({ ok: true }), token);
  }

  const next = nextDeviceMoveAt(existing.moved_at as string | null);
  if (next) {
    return NextResponse.json({ ok: false, reason: 'cooldown', nextMoveAt: next.toISOString() }, { status: 429 });
  }

  // 방금 읽은 번호일 때만 바꾼다 → 두 기기에서 동시에 눌러도 한 곳만 옮겨진다
  const { data: moved, error } = await admin
    .from('cbt_access')
    .update({ device_id: token, prev_device_id: null, moved_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('device_id', existing.device_id as string)
    .select('user_id');
  if (error) return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });
  if (!moved || moved.length === 0) {
    return NextResponse.json({ ok: false, reason: 'busy' }, { status: 409 });
  }
  return setDeviceCookie(NextResponse.json({ ok: true }), token);
}
