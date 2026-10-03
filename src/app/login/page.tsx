'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | 'kakao' | null>(null);
  const [hasError, setHasError] = useState(false);

  // useSearchParams(서버 Suspense 바일아웃) 대신 클라이언트에서 직접 읽어 즉시 렌더.
  useEffect(() => {
    setHasError(new URLSearchParams(window.location.search).get('error') != null);
  }, []);

  const signIn = async (provider: 'google' | 'kakao') => {
    setLoading(provider);
    const nextParam = new URLSearchParams(window.location.search).get('next');
    // 기본은 소소숲 홈으로. 특정 페이지(예: 한글놀이)에서 로그인 유도된 경우엔 그 페이지로 복귀.
    const next = nextParam && nextParam.startsWith('/') ? nextParam : '/';
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setLoading(null);
      alert('로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-8">소소숲 로그인</h1>

        {hasError && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            로그인에 실패했어요. 다시 시도해 주세요.
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={() => signIn('google')}
            disabled={loading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
            </svg>
            {loading === 'google' ? '이동 중…' : 'Google로 시작하기'}
          </button>

          <button
            onClick={() => signIn('kakao')}
            disabled={loading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] px-4 py-3 font-medium text-[#191600] transition hover:brightness-95 disabled:opacity-60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <path fill="#191600" d="M12 3C6.9 3 3 6.28 3 10.2c0 2.52 1.68 4.73 4.2 6l-.9 3.3c-.08.3.25.53.5.36l3.96-2.6c.4.04.82.06 1.24.06 5.1 0 9-3.28 9-7.18S17.1 3 12 3Z" />
            </svg>
            {loading === 'kakao' ? '이동 중…' : '카카오로 시작하기'}
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          로그인 시 소소숲{' '}
          <Link href="/terms" className="underline hover:text-gray-600">이용약관</Link> 및{' '}
          <Link href="/privacy" className="underline hover:text-gray-600">개인정보처리방침</Link>에
          동의하게 됩니다.
        </p>
      </div>
    </main>
  );
}
