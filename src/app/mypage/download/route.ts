// 유료 자료 다운로드 — 로그인·결제완료·이용기간을 확인한 뒤 60초짜리 서명 링크로 보낸다.
// 받을 때마다 download_logs 에 기록한다(공유 의심 확인용).
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugIds } from '@/lib/entitlements';
import { downloadUntil, paidFilesFor, PAID_FILES_BUCKET } from '@/lib/paid-files';

export const dynamic = 'force-dynamic';

const SIGNED_URL_SECONDS = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (reason: string) =>
    NextResponse.redirect(new URL(`/mypage?download=${reason}`, url.origin), { status: 302 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login?next=/mypage', url.origin), { status: 302 });
  }

  const productId = url.searchParams.get('product') ?? '';
  const file = paidFilesFor(productId).find((f) => f.key === url.searchParams.get('file'));
  if (!file) return back('notfound');

  const admin = createAdminClient();
  if (!admin) return back('error');

  const { data: orders, error } = await admin
    .from('orders')
    .select('product_slug, created_at')
    .eq('user_id', user.id)
    .eq('status', 'DONE');
  if (error) return back('error');

  const now = Date.now();
  const paid = (orders ?? []).filter((o) => slugIds(o.product_slug).includes(productId));
  if (paid.length === 0) return back('notpaid');
  if (!paid.some((o) => downloadUntil(o.created_at).getTime() > now)) return back('expired');

  const { data: signed, error: signError } = await admin.storage
    .from(PAID_FILES_BUCKET)
    .createSignedUrl(file.key, SIGNED_URL_SECONDS, { download: file.downloadName });
  if (signError || !signed) return back('error');

  // 기록 실패는 다운로드를 막지 않는다(insert는 에러를 던지지 않고 돌려준다).
  await admin
    .from('download_logs')
    .insert({ user_id: user.id, product_id: productId, file_key: file.key });

  const res = NextResponse.redirect(signed.signedUrl, { status: 302 });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
