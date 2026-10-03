'use server';

// 관리자 회원관리 액션. 서버 액션은 누구나 POST할 수 있는 입구이므로
// 매 액션마다 관리자 세션을 다시 확인하고, 입력은 전부 검증한다.
import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/admin';
import { isEntitlementActive, isEntitlementAlias } from '@/lib/entitlements';
import { createAdminClient } from '@/lib/supabase/admin';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function adminDb() {
  if (!(await getAdminUser())) throw new Error('관리자만 할 수 있는 작업입니다.');
  const db = createAdminClient();
  if (!db) throw new Error('서버 설정(SUPABASE_SERVICE_ROLE_KEY)이 없습니다.');
  return db;
}

function uuidField(formData: FormData, key: string): string {
  const value = String(formData.get(key) ?? '');
  if (!UUID.test(value)) throw new Error('잘못된 요청입니다.');
  return value;
}

function refresh(userId: string) {
  revalidatePath('/admin');
  revalidatePath(`/admin/members/${userId}`);
}

// CBT 기기 초기화 — 등록된 기기를 지우면 다음에 접속하는 기기가 새로 등록된다.
export async function resetCbtDevice(formData: FormData) {
  const db = await adminDb();
  const userId = uuidField(formData, 'userId');

  const { error } = await db.from('cbt_access').delete().eq('user_id', userId);
  if (error) throw new Error(`기기 초기화 실패: ${error.message}`);
  refresh(userId);
}

// 이용권 수동 지급 — 이미 유효한 지급이 있으면 중복으로 만들지 않는다.
export async function grantEntitlement(formData: FormData) {
  const db = await adminDb();
  const userId = uuidField(formData, 'userId');
  const product = String(formData.get('product') ?? '');
  if (!isEntitlementAlias(product)) throw new Error('잘못된 이용권입니다.');
  const note = String(formData.get('note') ?? '').trim().slice(0, 200) || null;

  const existing = await db
    .from('entitlement_grants')
    .select('granted_at')
    .eq('user_id', userId)
    .eq('product', product)
    .is('revoked_at', null);
  if (existing.error) throw new Error(`지급 실패: ${existing.error.message}`);

  // 기간이 끝난 지급은 없는 것으로 보고 새로 지급한다(CBT는 지급일부터 3개월).
  if (!(existing.data ?? []).some((g) => isEntitlementActive(product, g.granted_at))) {
    const { error } = await db.from('entitlement_grants').insert({ user_id: userId, product, note });
    if (error) throw new Error(`지급 실패: ${error.message}`);
  }
  refresh(userId);
}

// 수동 지급 취소.
export async function revokeGrant(formData: FormData) {
  const db = await adminDb();
  const userId = uuidField(formData, 'userId');
  const grantId = uuidField(formData, 'grantId');

  const { error } = await db
    .from('entitlement_grants')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', grantId)
    .eq('user_id', userId)
    .is('revoked_at', null);
  if (error) throw new Error(`지급 취소 실패: ${error.message}`);
  refresh(userId);
}

// 주문 상태 변경. 허용하는 전환은 두 가지뿐이다.
//   WAITING_FOR_DEPOSIT → DONE     : 가상계좌 입금 확인(웹훅이 없어 자동 전환되지 않음)
//   DONE → CANCELED                 : 토스에서 환불한 주문의 이용권 회수
// 실제 환불은 토스 대시보드에서 따로 해야 한다(여기선 기록만 바꾼다).
const ORDER_TRANSITIONS: Record<string, string> = {
  WAITING_FOR_DEPOSIT: 'DONE',
  DONE: 'CANCELED',
};

export async function changeOrderStatus(formData: FormData) {
  const db = await adminDb();
  const userId = uuidField(formData, 'userId');
  const orderRowId = uuidField(formData, 'orderRowId');
  const next = String(formData.get('next') ?? '');

  const current = await db
    .from('orders')
    .select('status')
    .eq('id', orderRowId)
    .eq('user_id', userId)
    .maybeSingle();
  if (current.error || !current.data) throw new Error('주문을 찾을 수 없습니다.');

  const from = String(current.data.status ?? '');
  if (ORDER_TRANSITIONS[from] !== next) throw new Error('허용되지 않는 상태 변경입니다.');

  const { error } = await db
    .from('orders')
    .update({ status: next })
    .eq('id', orderRowId)
    .eq('status', from);
  if (error) throw new Error(`주문 상태 변경 실패: ${error.message}`);
  refresh(userId);
}
