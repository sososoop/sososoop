import { notFound } from 'next/navigation';
import { getAdminUser } from '@/lib/admin';
import CsManualView from './CsManualView';
import { CS_CASES } from './manual';

// 고객센터 문의응대 매뉴얼 — 문의 종류별 확인할 것·처리 순서·복사용 답장
export default async function AdminCsPage() {
  if (!(await getAdminUser())) notFound();
  return <CsManualView cases={CS_CASES} />;
}
