import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdminUser } from '@/lib/admin';
import { listSurveyResponses } from '@/lib/surveys';
import ServiceKeyMissing from '../_components/ServiceKeyMissing';
import { formatDateTime } from '../_components/format';

// 설문: 문항별 집계 + 먼저 안내받기 원하는 분 연락처 + 전체 응답
export default async function AdminSurveysPage() {
  if (!(await getAdminUser())) notFound();
  const result = await listSurveyResponses();
  if (!result) return <ServiceKeyMissing />;

  return (
    <main className="max-w-[1120px] mx-auto px-6 py-8 flex flex-col gap-12">
      <div>
        <h1 className="text-[22px] font-bold text-ink">설문</h1>
        {!result.tableReady && (
          <p className="mt-3 text-[13px] text-red-600">응답 표를 읽지 못했어요. db/surveys.sql 을 실행했는지 확인해 주세요.</p>
        )}
      </div>

      {result.surveys.map(({ survey, responses }) => {
        const total = responses.length;
        const questions = [...survey.questions, { id: survey.notify.id, title: survey.notify.title, multi: false, options: [survey.notify.yes, survey.notify.no], other: false }];
        const tally = (id: string, options: string[]) => {
          const m = new Map<string, number>(options.map((o) => [o, 0]));
          responses.forEach((r) => [r.answers[id] ?? []].flat().forEach((v) => m.set(v, (m.get(v) ?? 0) + 1)));
          return [...m.entries()];
        };
        const notify = responses.filter((r) => r.answers[survey.notify.id] === survey.notify.yes);
        return (
          <section key={survey.slug} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="text-[18px] font-bold text-ink">{survey.title}</h2>
              <span className="text-[13px] text-ink-muted">
                응답 {total}명 · 먼저 안내 {notify.length}명
              </span>
              <Link href={`/survey/${survey.slug}`} className="text-[13px] text-primary hover:underline">
                설문 페이지 →
              </Link>
            </div>

            {total > 0 && (
              <div className="grid md:grid-cols-2 gap-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="px-4 py-3 rounded-xl border border-hairline bg-white text-[13px]">
                    <p className="font-semibold text-ink mb-2 leading-snug">
                      {i + 1}. {q.title}
                      {q.multi && <span className="ml-1 text-[12px] font-normal text-ink-light">(복수)</span>}
                    </p>
                    {tally(q.id, q.options).map(([k, v]) => (
                      <div key={k} className="mb-1.5">
                        <p className="flex justify-between gap-3 text-ink-muted">
                          <span className={k.startsWith('기타: ') ? 'text-ink-light' : ''}>{k}</span>
                          <span className="font-semibold text-ink">{v}</span>
                        </p>
                        <div className="mt-0.5 h-1.5 rounded-full bg-pearl overflow-hidden">
                          <div className="h-full bg-primary/70" style={{ width: `${total ? (v / total) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {notify.length > 0 && (
              <details className="text-[13px]" open>
                <summary className="cursor-pointer text-ink-muted">먼저 안내받기 원하는 분 연락처 복사하기 ({notify.length}명)</summary>
                <textarea
                  readOnly
                  rows={Math.min(8, notify.length + 1)}
                  className="mt-2 w-full px-3 py-2 rounded-lg border border-hairline bg-white font-mono text-[12px]"
                  defaultValue={notify.map((r) => `${r.name ?? ''}\t${r.contact ?? ''}\t${r.email ?? ''}`).join('\n')}
                />
              </details>
            )}

            <div className="overflow-x-auto bg-white border border-hairline rounded-xl">
              <table className="w-full text-[13px]">
                <thead className="bg-pearl text-ink-muted">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">응답자</th>
                    <th className="text-left px-4 py-2.5 font-semibold">참여 의향</th>
                    <th className="text-left px-4 py-2.5 font-semibold">시간 · 지역</th>
                    <th className="text-left px-4 py-2.5 font-semibold">걱정 · 중요</th>
                    <th className="text-left px-4 py-2.5 font-semibold">응답</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r) => {
                    const a = (id: string) => [r.answers[id] ?? []].flat().join(', ') || '-';
                    return (
                      <tr key={r.id} className="border-t border-hairline align-top">
                        <td className="px-4 py-2.5">
                          <span className="text-ink font-medium">{r.name ?? '(연락처 없음)'}</span>
                          {r.contact && <span className="block text-ink">{r.contact}</span>}
                          <span className="block text-[12px] text-ink-light">{r.email ?? ''}</span>
                          <Link href={`/admin/members/${r.userId}`} className="block text-[12px] text-primary hover:underline">
                            회원 보기
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-ink-muted">
                          {a('intent')}
                          <span className="block text-[12px] text-ink-light">안내: {a(survey.notify.id)}</span>
                        </td>
                        <td className="px-4 py-2.5 text-ink-muted max-w-[260px]">
                          <span className="block">{a('times')}</span>
                          <span className="block mt-1">{a('region')}</span>
                        </td>
                        <td className="px-4 py-2.5 text-ink-muted max-w-[320px]">
                          <span className="block">{a('worries')}</span>
                          <span className="block mt-1 text-ink">중요: {a('priority')}</span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-ink-muted">
                          {formatDateTime(r.createdAt)}
                          {Date.parse(r.updatedAt) - Date.parse(r.createdAt) > 60_000 && <span className="block text-[12px] text-ink-light">수정 {formatDateTime(r.updatedAt)}</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {total === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-ink-light">
                        아직 응답이 없어요.
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
