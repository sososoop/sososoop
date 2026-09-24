// CBT 연습앱 원본(단일 HTML, 로그인프리 번들)을 서빙 — 로그인+결제+기기 게이트 뒤.
// page.tsx의 DeviceGate가 iframe으로 이걸 불러온다. 라우트에서도 3중 재확인(직접 접근 방어).
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin';
import { hasCbtEntitlement } from '@/lib/entitlements';
import appHtml from '../app-html.json';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', '/slp-cbt-practice');
    return NextResponse.redirect(url);
  }

  // 관리자 계정은 이용권·기기 제한 없이 통과.
  const adminUser = isAdmin(user);

  // 결제 확인
  const entitled = adminUser || (await hasCbtEntitlement(user.id));
  if (!entitled) return NextResponse.redirect(new URL('/slp-cbt-practice', request.url));

  // 기기 확인 — 바인딩 쿠키가 DB에 등록된 기기와 일치해야 함(직접 접근 시 게이트로 회귀)
  if (!adminUser) {
    const cookieStore = await cookies();
    const devCookie = cookieStore.get('slp_cbt_dev')?.value;
    const admin = createAdminClient();
    if (!admin) return NextResponse.redirect(new URL('/slp-cbt-practice', request.url));
    const { data: access } = await admin
      .from('cbt_access')
      .select('device_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!devCookie || !access || access.device_id !== devCookie) {
      return NextResponse.redirect(new URL('/slp-cbt-practice', request.url));
    }
  }

  // 앱의 "내 학습 기록"(오답노트·응시 기록)은 기기 localStorage에 계정별로 저장한다 — 저장 키에 쓸 회원 id를 넣어 준다.
  const html = (appHtml as string).replace(
    '</head>',
    `<script>window.STUDY_USER = ${JSON.stringify(user.id)};</script>\n</head>`,
  );

  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, no-store',
    },
  });
}
