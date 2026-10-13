// 무료 LIVE 강의 자료 다운로드 — 로그인·신청(취소 안 함)을 확인한 뒤 60초짜리 서명 링크로 보낸다.
// 파일은 유료 자료와 같은 비공개 저장소(paid-files)에 두고, 받을 때마다 download_logs 에 기록한다.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PAID_FILES_BUCKET } from '@/lib/paid-files';
import { getFreeLive, isMaterialsOpen } from '@/data/freeLives';

export const dynamic = 'force-dynamic';

const SIGNED_URL_SECONDS = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (reason: string) =>
    NextResponse.redirect(new URL(`/mypage?download=${reason}#lives`, url.origin), { status: 302 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login?next=/mypage', url.origin), { status: 302 });
  }

  const live = getFreeLive(url.searchParams.get('live') ?? '');
  const file = live?.materials?.find((f) => f.key === url.searchParams.get('file'));
  if (!live || !file) return back('notfound');
  if (!isMaterialsOpen(live)) return back('notyet');

  const admin = createAdminClient();
  if (!admin) return back('error');

  const { data: reg, error } = await admin
    .from('free_live_registrations')
    .select('id')
    .eq('event_slug', live.slug)
    .eq('user_id', user.id)
    .is('canceled_at', null)
    .maybeSingle();
  if (error) return back('error');
  if (!reg) return back('notregistered');

  // 한글 파일 이름은 직접 붙인다(supabase-js download 옵션은 이름을 두 번 인코딩한다).
  const { data: signed, error: signError } = await admin.storage
    .from(PAID_FILES_BUCKET)
    .createSignedUrl(file.key, SIGNED_URL_SECONDS);
  if (signError || !signed) return back('error');
  const downloadUrl = `${signed.signedUrl}&download=${encodeURIComponent(file.downloadName)}`;

  await admin
    .from('download_logs')
    .insert({ user_id: user.id, product_id: `live:${live.slug}`, file_key: file.key });

  const res = NextResponse.redirect(downloadUrl, { status: 302 });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
