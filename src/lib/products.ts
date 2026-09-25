// 결제 가능한 상품(유료 자료 + 강의)을 id로 해석하는 서버 전용 모듈.
// 금액의 신뢰 원천은 Notion(폴백=static 데이터)이며, 클라이언트가 보낸 금액은
// 결제 승인(confirm) 시 이 값과 대조해 위변조를 차단한다.

import { getResources, getLectures } from '@/lib/notion';
import { freeResources, paidResources, type Resource } from '@/data/resources';
import { lectures as staticLectures, type Lecture } from '@/data/lectures';

export type Purchasable = {
  id: string;
  title: string;
  orderName: string; // 토스 결제창/영수증 표기명
  amount: number; // KRW
  kind: 'resource' | 'lecture';
};

// 상품 id 대신 쓰는 고정 별칭 → Notion 상품 제목.
// (/checkout?product=cbt 같은 URL을 Notion 페이지 UUID와 무관하게 유지하기 위함)
const CBT_TITLE = '언어재활사 CBT 연습앱 이용권';
const HANGUL_TITLE = '한글놀이 이용권';
const ALIAS_TITLES: Record<string, string> = {
  cbt: CBT_TITLE,
  hangul: HANGUL_TITLE,
};

// 별칭이면 유료 자료 목록에서 같은 제목의 상품 id로 바꿔준다.
function resolveAlias(rawId: string, paid: Resource[]): string {
  const title = ALIAS_TITLES[rawId];
  if (!title) return rawId;
  return paid.find((r) => r.title === title)?.id ?? rawId;
}

async function loadResources(): Promise<Resource[]> {
  return (await getResources()) ?? [...freeResources, ...paidResources];
}

async function loadLectures(): Promise<Lecture[]> {
  return (await getLectures()) ?? staticLectures;
}

function pickResource(paid: Resource[], id: string): Purchasable | null {
  const res = paid.find((r) => r.id === id);
  if (res && typeof res.price === 'number' && res.price > 0) {
    return { id: res.id, title: res.title, orderName: res.title, amount: res.price, kind: 'resource' };
  }
  return null;
}

function pickLecture(lects: Lecture[], id: string): Purchasable | null {
  const lec = lects.find((l) => l.id === id);
  if (lec && typeof lec.price === 'number' && lec.price > 0) {
    return { id: lec.id, title: lec.title, orderName: lec.title, amount: lec.price, kind: 'lecture' };
  }
  return null;
}

// id로 결제 상품 하나를 해석한다. 유료 자료를 먼저, 없으면 강의에서 찾는다.
export async function getPurchasable(
  rawId: string | undefined | null,
): Promise<Purchasable | null> {
  if (!rawId) return null;

  const [resources, lects] = await Promise.all([loadResources(), loadLectures()]);
  const paid = resources.filter((r) => r.type === 'paid');

  const id = resolveAlias(rawId, paid);

  return pickResource(paid, id) ?? pickLecture(lects, id);
}

// 이용권 소개 화면의 [장바구니 담기]용. 별칭(cbt·hangul)을 실제 상품 id로 풀어
// 자료실 상세페이지에서 담은 것과 같은 상품으로 담기게 한다.
export async function getCartItem(
  rawId: string,
): Promise<{ id: string; title: string; price: number; image?: string } | null> {
  const paid = (await loadResources()).filter((r) => r.type === 'paid');
  const res = paid.find((r) => r.id === resolveAlias(rawId, paid));
  if (!res || typeof res.price !== 'number' || res.price <= 0) return null;
  return { id: res.id, title: res.title, price: res.price, image: res.image };
}

export type Order = {
  items: Purchasable[];
  total: number;
  orderName: string; // "상품명" 또는 "상품명 외 N건"
};

// 여러 id를 한 번의 데이터 조회로 주문으로 해석한다(장바구니 결제용).
export async function resolveOrder(rawIds: string[]): Promise<Order | null> {
  const ids = Array.from(new Set(rawIds.filter(Boolean)));
  if (ids.length === 0) return null;

  const [resources, lects] = await Promise.all([loadResources(), loadLectures()]);
  const paid = resources.filter((r) => r.type === 'paid');

  const items: Purchasable[] = [];
  for (const rawId of ids) {
    const id = resolveAlias(rawId, paid);
    if (items.some((it) => it.id === id)) continue; // 별칭 등으로 인한 중복 제거
    const found = pickResource(paid, id) ?? pickLecture(lects, id);
    if (found) items.push(found);
  }

  if (items.length === 0) return null;

  const total = items.reduce((sum, it) => sum + it.amount, 0);
  const orderName =
    items.length === 1 ? items[0].orderName : `${items[0].orderName} 외 ${items.length - 1}건`;

  return { items, total, orderName };
}
