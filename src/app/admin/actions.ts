'use server';

// 관리자 회원관리 액션. 서버 액션은 누구나 POST할 수 있는 입구이므로
// 매 액션마다 관리자 세션을 다시 확인하고, 입력은 전부 검증한다.
import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/admin';
import { isEntitlementActive, isEntitlementAlias } from '@/lib/entitlements';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFreeLive } from '@/data/freeLives';

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

// 테스트 쿠폰 만들기 — 관리자 테스트 주문으로 쿠폰 적용·사용 처리를 확인할 때 쓴다.
// 헷갈리는 글자(0·O·1·I·L)를 뺀 8자리. 구분은 '테스트'로 남겨 실제 발송 쿠폰과 구별한다.
const COUPON_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export async function createTestCoupon(formData: FormData) {
  const db = await adminDb();
  const admin = await getAdminUser();
  const percent = Number(formData.get('percent'));
  if (!Number.isInteger(percent) || percent < 1 || percent > 99) throw new Error('할인율은 1~99%로 정해 주세요.');

  const pick = () =>
    Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => COUPON_CHARS[n % COUPON_CHARS.length]).join('');
  const code = `TEST-${pick()}-${pick()}`;
  const { error } = await db.from('coupons').insert({
    code,
    product: 'cbt',
    percent,
    name: '관리자 테스트',
    email: admin?.email ?? null,
    grp: '테스트',
  });
  if (error) throw new Error(`테스트 쿠폰 만들기 실패: ${error.message}`);
  revalidatePath('/admin/coupons');
}

// 무료 LIVE ZOOM 링크 저장 — 신청자 마이페이지에만 보인다. 링크를 비우면 '곧 올려 드려요'로 돌아간다.
export async function setLiveZoom(formData: FormData) {
  const db = await adminDb();
  const slug = String(formData.get('slug') ?? '');
  if (!getFreeLive(slug)) throw new Error('잘못된 LIVE입니다.');
  const url = String(formData.get('zoomUrl') ?? '').trim().slice(0, 500);
  if (url && !/^https:\/\/([a-z0-9-]+\.)*zoom\.(us|com)\//i.test(url)) throw new Error('ZOOM 링크(https://….zoom.us/…)를 넣어 주세요.');
  const note = String(formData.get('zoomNote') ?? '').trim().slice(0, 300) || null;

  const { error } = await db
    .from('free_live_events')
    .upsert({ slug, zoom_url: url || null, zoom_note: note, updated_at: new Date().toISOString() });
  if (error) throw new Error(`ZOOM 링크 저장 실패: ${error.message}`);
  revalidatePath('/admin/lives');
  revalidatePath('/mypage');
}
