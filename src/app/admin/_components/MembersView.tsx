import Link from 'next/link';
import type { MemberSummary } from '@/lib/admin-data';
import EntitlementBadges from './EntitlementBadges';
import GrantsTableNotice from './GrantsTableNotice';
import { formatDate, formatDateTime, formatWon, providerLabel } from './format';

export const MEMBER_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'hangul', label: '한글놀이 보유' },
  { value: 'cbt', label: '모의 CBT 보유' },
  { value: 'none', label: '이용권 없음' },
  { value: 'deposit', label: '입금대기 있음' },
] as const;

export type MemberFilter = (typeof MEMBER_FILTERS)[number]['value'];

export function filterMembers(members: MemberSummary[], q: string, filter: MemberFilter) {
  const query = q.trim().toLowerCase();
  return members.filter((m) => {
    if (query && !`${m.name} ${m.email} ${m.phone ?? ''}`.toLowerCase().includes(query)) return false;
    switch (filter) {
      case 'hangul':
        return m.entitlements.hangul.length > 0;
      case 'cbt':
        return m.entitlements.cbt.length > 0;
      case 'none':
        return Object.values(m.entitlements).every((s) => s.length === 0);
      case 'deposit':
        return m.waitingDeposit > 0;
      default:
        return true;
    }
  });
}

export default function MembersView({
  members,
  shown,
  q,
  filter,
  grantsTableReady,
}: {
  members: MemberSummary[];
  shown: MemberSummary[];
  q: string;
  filter: MemberFilter;
  grantsTableReady: boolean;
}) {
  const stats = [
    { label: '전체 회원', value: members.length },
    { label: '한글놀이 이용권', value: members.filter((m) => m.entitlements.hangul.length > 0).length },
    { label: '모의 CBT 이용권', value: members.filter((m) => m.entitlements.cbt.length > 0).length },
    { label: '입금대기', value: members.filter((m) => m.waitingDeposit > 0).length, alert: true },
  ];
  // 결제 때 휴대폰 번호를 남긴 회원(모의 CBT, 2026-10-14~). 새 소식(광고) 문자는 동의한 분에게만 보낸다.
  const copyGroups: [string, MemberSummary[]][] = [
    ['이용 안내용', shown.filter((m) => m.phone)],
    ['새 소식 동의', shown.filter((m) => m.phone && m.smsNews)],
  ];

  return (
    <main className="max-w-[1120px] mx-auto px-6 py-10">
      <h1 className="text-[24px] font-semibold text-ink mb-6">회원관리</h1>

      {!grantsTableReady && <GrantsTableNotice />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-[14px] border p-4 ${
              s.alert && s.value > 0 ? 'border-amber-200 bg-amber-50' : 'border-hairline bg-pearl'
            }`}
          >
            <p className="text-[12px] text-ink-muted mb-1">{s.label}</p>
            <p className="text-[22px] font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 검색은 GET 폼 → 주소에 남아 새로고침·뒤로가기에도 유지 */}
      <form method="get" className="flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="이름, 이메일 또는 휴대폰 번호"
          className="flex-1 min-w-[200px] px-4 py-2 rounded-full border border-hairline bg-canvas text-[14px] text-ink focus:outline-none focus:border-primary"
        />
        <select
          name="filter"
          defaultValue={filter}
          className="px-4 py-2 rounded-full border border-hairline bg-canvas text-[14px] text-ink"
        >
          {MEMBER_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-5 py-2 rounded-full bg-primary text-white text-[14px] font-medium hover:bg-primary-dark transition-colors"
        >
          검색
        </button>
      </form>

      <p className="text-[13px] text-ink-muted mb-3">{shown.length}명</p>

      {copyGroups.map(([label, list]) =>
        list.length > 0 ? (
          <details key={label} className="text-[13px] mb-3">
            <summary className="cursor-pointer text-ink-muted">
              {label} 연락처 한 번에 복사하기 ({list.length}명)
            </summary>
            <textarea
              readOnly
              rows={4}
              className="mt-2 w-full px-3 py-2 rounded-lg border border-hairline bg-white font-mono text-[12px]"
              defaultValue={list.map((m) => `${m.name}\t${m.phone}\t${m.email}`).join('\n')}
            />
          </details>
        ) : null,
      )}

      <div className="overflow-x-auto rounded-[14px] border border-hairline bg-canvas">
        <table className="w-full min-w-[820px] text-left text-[14px]">
          <thead className="bg-pearl text-[12px] text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">회원</th>
              <th className="px-4 py-3 font-medium">로그인</th>
              <th className="px-4 py-3 font-medium">가입일</th>
              <th className="px-4 py-3 font-medium">마지막 접속</th>
              <th className="px-4 py-3 font-medium">이용권</th>
              <th className="px-4 py-3 font-medium text-right">결제액</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id} className="border-t border-hairline hover:bg-pearl/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/members/${m.id}`} className="group block">
                    <span className="block font-medium text-ink group-hover:text-primary">{m.name}</span>
                    <span className="block text-[12px] text-ink-light">{m.email || '(이메일 없음)'}</span>
                    {m.phone && (
                      <span className="block text-[12px] text-ink-light">
                        {m.phone}
                        {m.smsNews && <span className="ml-1.5 text-primary">· 새 소식 동의</span>}
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{providerLabel(m.providers)}</td>
                <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{formatDate(m.createdAt)}</td>
                <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{formatDateTime(m.lastSignInAt)}</td>
                <td className="px-4 py-3">
                  <EntitlementBadges entitlements={m.entitlements} />
                  {m.waitingDeposit > 0 && (
                    <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[12px] font-medium">
                      입금대기 {m.waitingDeposit}건
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-ink whitespace-nowrap">{formatWon(m.paidTotal)}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-light">
                  조건에 맞는 회원이 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
