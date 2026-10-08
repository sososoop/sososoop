import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdminUser } from '@/lib/admin';
import { listLiveRegistrations } from '@/lib/free-lives';
import ServiceKeyMissing from '../_components/ServiceKeyMissing';
import { formatDateTime } from '../_components/format';
import { setLiveZoom } from '../actions';

// 무료 LIVE: ZOOM 링크 입력 + 신청자 명단
export default async function AdminLivesPage() {
  if (!(await getAdminUser())) notFound();
  const result = await listLiveRegistrations();
  if (!result) return <ServiceKeyMissing />;

  return (
    <main className="max-w-[1120px] mx-auto px-6 py-8 flex flex-col gap-12">
      <div>
        <h1 className="text-[22px] font-bold text-ink">무료 LIVE</h1>
        {!result.tableReady && (
          <p className="mt-3 text-[13px] text-red-600">신청 표를 읽지 못했어요. db/free_lives.sql 을 실행했는지 확인해 주세요.</p>
        )}
      </div>

      {result.events.map(({ live, zoom, registrations }) => {
        const active = registrations.filter((r) => !r.canceledAt);
        const canceled = registrations.length - active.length;
        const count = (pick: (r: (typeof active)[number]) => string | string[] | null) => {
          const m = new Map<string, number>();
          active.forEach((r) => [pick(r) ?? []].flat().forEach((v) => v && m.set(v, (m.get(v) ?? 0) + 1)));
          return [...m.entries()].sort((a, b) => b[1] - a[1]);
        };
        const stats: [string, [string, number][]][] = [
          ['준비 시험', count((r) => r.exam)],
          ['걱정', count((r) => r.worries)],
          ['오프라인 관심', count((r) => r.offlineInterest)],
        ];
        return (
          <section key={live.slug} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="text-[18px] font-bold text-ink">{live.title}</h2>
              <span className="text-[13px] text-ink-muted">
                {live.dateLabel} {live.timeLabel} · 신청 {active.length}명{canceled ? ` · 취소 ${canceled}명` : ''}
              </span>
              <Link href={`/lectures/live/${live.slug}`} className="text-[13px] text-primary hover:underline">
                신청 페이지 →
              </Link>
            </div>

            <form action={setLiveZoom} className="flex flex-col gap-2 px-4 py-4 rounded-xl border border-hairline bg-pearl">
              <input type="hidden" name="slug" value={live.slug} />
              <label className="text-[13px] font-semibold text-ink">ZOOM 링크 (신청자 마이페이지에만 보여요)</label>
              <input
                name="zoomUrl"
                defaultValue={zoom.url ?? ''}
                placeholder="https://us06web.zoom.us/j/…"
                className="px-3 py-2 rounded-lg border border-hairline bg-white text-[13px]"
              />
              <input
                name="zoomNote"
                defaultValue={zoom.note ?? ''}
                placeholder="함께 보여 줄 메모 (예: 회의 ID 123 456 7890 · 암호 1013)"
                className="px-3 py-2 rounded-lg border border-hairline bg-white text-[13px]"
              />
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 rounded-lg bg-ink text-white text-[13px]">저장</button>
                <span className="text-[12px] text-ink-light">
                  {zoom.url ? '저장됨 — 신청자에게 보이고 있어요.' : '아직 링크가 없어요 — 신청자에게는 “LIVE 전에 올려 드려요”로 보여요.'}
                </span>
              </div>
            </form>

            {active.length > 0 && (
              <div className="grid md:grid-cols-3 gap-3">
                {stats.map(([label, rows]) => (
                  <div key={label} className="px-4 py-3 rounded-xl border border-hairline bg-white text-[13px]">
                    <p className="font-semibold text-ink mb-1.5">{label}</p>
                    {rows.length === 0 ? (
                      <p className="text-ink-light">-</p>
                    ) : (
                      rows.map(([k, v]) => (
                        <p key={k} className="flex justify-between gap-3 text-ink-muted">
                          <span className="truncate">{k}</span>
                          <span className="font-semibold text-ink">{v}</span>
                        </p>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}

            {active.length > 0 && (
              <details className="text-[13px]">
                <summary className="cursor-pointer text-ink-muted">연락처 한 번에 복사하기 ({active.length}명)</summary>
                <textarea
                  readOnly
                  rows={4}
                  className="mt-2 w-full px-3 py-2 rounded-lg border border-hairline bg-white font-mono text-[12px]"
                  defaultValue={active.map((r) => `${r.name}\t${r.phone}\t${r.email ?? ''}`).join('\n')}
                />
              </details>
            )}

            <div className="overflow-x-auto bg-white border border-hairline rounded-xl">
              <table className="w-full text-[13px]">
                <thead className="bg-pearl text-ink-muted">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">이름</th>
                    <th className="text-left px-4 py-2.5 font-semibold">연락처</th>
                    <th className="text-left px-4 py-2.5 font-semibold">시험</th>
                    <th className="text-left px-4 py-2.5 font-semibold">걱정 · 질문</th>
                    <th className="text-left px-4 py-2.5 font-semibold">오프라인</th>
                    <th className="text-left px-4 py-2.5 font-semibold">신청</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.id} className={`border-t border-hairline align-top ${r.canceledAt ? 'opacity-45' : ''}`}>
                      <td className="px-4 py-2.5">
                        <span className="text-ink font-medium">{r.name}</span>
                        {r.instagram && <span className="block text-[12px] text-ink-light">@{r.instagram}</span>}
                        <Link href={`/admin/members/${r.userId}`} className="block text-[12px] text-primary hover:underline">
                          회원 보기
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {r.phone}
                        <span className="block text-[12px] text-ink-light">{r.email ?? ''}</span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.exam ?? '-'}</td>
                      <td className="px-4 py-2.5 text-ink-muted max-w-[360px]">
                        {r.worries.length > 0 && <span className="block">{r.worries.join(', ')}</span>}
                        {r.question && <span className="block mt-1 text-ink">Q. {r.question}</span>}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-ink-muted">{r.offlineInterest ?? '-'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-ink-muted">
                        {formatDateTime(r.createdAt)}
                        {r.canceledAt && <span className="block text-[12px] text-red-600">취소 {formatDateTime(r.canceledAt)}</span>}
                      </td>
                    </tr>
                  ))}
                  {registrations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-ink-light">
                        아직 신청자가 없어요.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </main>
  );
}
