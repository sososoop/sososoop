// 관리자 판별 — 서버 전용.
// 소소숲은 소셜 로그인만 있으므로 별도 관리자 아이디 대신, 환경변수 ADMIN_EMAILS(콤마 구분)에
// 등록된 "구글 계정"으로 로그인한 유저를 관리자로 본다. 저장소가 공개라 이메일은 코드가 아닌
// Cloudflare secret(로컬은 .env.local)에 둔다.
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// 같은 이메일의 카카오 계정으로는 관리자가 될 수 없도록, 구글 identity의 이메일로만 판정한다.
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  const allowed = adminEmails();
  if (allowed.length === 0) return false;
  return (user.identities ?? []).some(
    (identity) =>
      identity.provider === 'google' &&
      allowed.includes(String(identity.identity_data?.email ?? '').toLowerCase()),
  );
}

// 통계에서 뺄 관리자 계정인지 — 로그인 권한 판정(isAdmin)보다 넓게, 계정 이메일이 같아도 관리자로 본다.
// 관리자 화면 접근에는 쓰지 말 것(접근은 isAdmin으로만).
export function isAdminAccount(user: User | null | undefined): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return adminEmails().includes(String(user.email ?? '').toLowerCase());
}

// 현재 세션이 관리자면 그 유저, 아니면 null.
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdmin(user) ? user : null;
}
