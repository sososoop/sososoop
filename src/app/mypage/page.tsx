import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyPageData } from '@/lib/mypage';
import MyPageView from './_components/MyPageView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '마이페이지',
  robots: { index: false, follow: false },
};

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mypage');

  return <MyPageView data={await getMyPageData(user)} />;
}
