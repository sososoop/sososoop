import { notFound } from 'next/navigation';
import { getAdminUser } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import ServiceKeyMissing from '../_components/ServiceKeyMissing';
import { formatDateTime } from '../_components/format';

type CouponRow = {
  code: string;
  percent: number;
  name: string | null;
  email: string | null;
  grp: string | null;
  used_at: string | null;
  used_order_id: string | null;
};

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; used?: string }>;
}) {
  if (!(await getAdminUser())) notFound();
  const db = createAdminClient();
  if (!db) return <ServiceKeyMissing />;

  const { q = '', used = 'all' } = await searchParams;
  const { data, error } = await db
    .from('coupons')
    .select('code, percent, name, email, grp, used_at, used_order_id')
    .order('grp')
    .order('name');
  const rows = (error ? [] : (data ?? [])) as CouponRow[];
  const query = q.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (!query || `${r.code} ${r.name ?? ''} ${r.email ?? ''}`.toLowerCase().includes(query)) &&
      (used === 'all' || (used === 'yes' ? !!r.used_at : !r.used_at)),
  );
  const usedCount = rows.filter((r) => r.used_at).length;

  return (
    <main className="max-w-[1120px] mx-auto px-6 py-8">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-5">
        <h1 className="text-[22px] font-bold text-ink">쿠폰</h1>
        <span className="text-[13px] text-ink-muted">
          모의 CBT 이용권 전용 · 전체 {rows.length}개 · 사용 {usedCount}개 · 남음 {rows.length - usedCount}개
        </span>
      </div>
      {error && (
        <p className="mb-4 text-[13px] text-red-600">쿠폰 표를 읽지 못했어요. db/coupons.sql 을 실행했는지 확인해 주세요.</p>
      )}

      <form className="flex flex-wrap gap-2 mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="이름·이메일·코드 검색"
          className="px-3 py-2 rounded-lg border border-hairline bg-white text-[13px] w-[240px]"
        />
        <select name="used" defaultValue={used} className="px-3 py-2 rounded-lg border border-hairline bg-white text-[13px]">
          <option value="all">전체</option>
          <option value="no">안 씀</option>
          <option value="yes">사용함</option>
        </select>
        <button className="px-4 py-2 rounded-lg bg-ink text-white text-[13px]">보기</button>
      </form>

      <div className="overflow-x-auto bg-white border border-hairline rounded-xl">
        <table className="w-full text-[13px]">
          <thead className="bg-pearl text-ink-muted">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">받는 사람</th>
              <th className="text-left px-4 py-2.5 font-semibold">구분</th>
              <th className="text-left px-4 py-2.5 font-semibold">코드</th>
              <th className="text-left px-4 py-2.5 font-semibold">할인</th>
              <th className="text-left px-4 py-2.5 font-semibold">사용</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.code} className="border-t border-hairline">
                <td className="px-4 py-2.5">
                  <span className="text-ink font-medium">{r.name || '-'}</span>
                  <span className="block text-[12px] text-ink-light">{r.email || ''}</span>
                </td>
                <td className="px-4 py-2.5 text-ink-muted whitespace-nowrap">{r.grp || '-'}</td>
                <td className="px-4 py-2.5 font-mono whitespace-nowrap">{r.code}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{r.percent}%</td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {r.used_at ? (
                    <span className="text-primary font-semibold">{formatDateTime(r.used_at)}</span>
                  ) : (
                    <span className="text-ink-light">안 씀</span>
                  )}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-light">
                  해당하는 쿠폰이 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
