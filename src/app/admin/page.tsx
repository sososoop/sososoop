import { notFound } from 'next/navigation';
import { getAdminUser } from '@/lib/admin';
import { listMembers } from '@/lib/admin-data';
import MembersView, { filterMembers, MEMBER_FILTERS, type MemberFilter } from './_components/MembersView';
import ServiceKeyMissing from './_components/ServiceKeyMissing';

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  // 레이아웃에서도 확인하지만, 페이지 단위로 한 번 더(레이아웃은 클라이언트 이동 시 재실행되지 않을 수 있음).
  if (!(await getAdminUser())) notFound();

  const { q = '', filter: rawFilter = 'all' } = await searchParams;
  const filter: MemberFilter = MEMBER_FILTERS.some((f) => f.value === rawFilter)
    ? (rawFilter as MemberFilter)
    : 'all';

  const result = await listMembers();
  if (!result) return <ServiceKeyMissing />;

  return (
    <MembersView
      members={result.members}
      revenue={result.revenue}
      shown={filterMembers(result.members, q, filter)}
      q={q}
      filter={filter}
      grantsTableReady={result.grantsTableReady}
    />
  );
}
