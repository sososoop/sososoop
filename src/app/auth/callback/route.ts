// OAuth(구글·카카오) 로그인 후 돌아오는 콜백 — 인가코드를 세션으로 교환한다.
// 돌아갈 곳은 로그인 페이지가 담아 둔 쿠키(sososoop_next)에서 읽는다(예전 방식 ?next= 도 받는다).
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const NEXT_COOKIE = 'sososoop_next';

// 오픈 리다이렉트 방지: 사이트 안 경로만 허용
function safeNext(value: string | null | undefined): string | null {
  if (!value) return null;
  let v = value;
  try {
    v = decodeURIComponent(value);
  } catch {
    return null;
  }
  return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/login') ? v : null;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const cookieStore = await cookies();
  const next = safeNext(searchParams.get('next')) ?? safeNext(cookieStore.get(NEXT_COOKIE)?.value) ?? '/';

  let response = NextResponse.redirect(`${origin}/login?error=auth`);
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) response = NextResponse.redirect(`${origin}${next}`);
  }
  response.cookies.delete(NEXT_COOKIE);
  return response;
}
