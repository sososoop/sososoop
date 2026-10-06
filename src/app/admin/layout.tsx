import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminUser } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '관리자',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 관리자가 아니면 페이지가 존재하지 않는 것처럼 404. (각 페이지·액션에서도 다시 확인)
  const admin = await getAdminUser();
  if (!admin) notFound();

  return (
    <div className="flex-1 bg-canvas">
      <div className="border-b border-hairline bg-pearl">
        <div className="max-w-[1120px] mx-auto px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="text-[13px] font-semibold text-ink">소소숲 관리자</span>
          <nav className="flex gap-4 text-[13px]">
            <Link href="/admin" className="text-ink-muted hover:text-primary transition-colors">
              회원관리
            </Link>
            <Link href="/admin/coupons" className="text-ink-muted hover:text-primary transition-colors">
              쿠폰
            </Link>
          </nav>
          <span className="ml-auto text-[12px] text-ink-light">{admin.email}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
