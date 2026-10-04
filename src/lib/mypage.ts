// 마이페이지 데이터 — 서버 전용. 로그인한 본인의 이용권·구매내역만 읽는다.
import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPurchasable } from '@/lib/products';
import { getResourcesCached } from '@/lib/notion';
import { downloadUntil, paidFilesFor } from '@/lib/paid-files';
import {
  entitlementProductIds,
  getCbtEntitlement,
  hasHangulEntitlement,
  slugIds,
  type EntitlementAlias,
  type EntitlementStatus,
} from '@/lib/entitlements';

export type MyOrderItem = {
  productId: string;
  title: string;
  // 이용권이면 바로 가는 사이트 안 주소
  href: string | null;
  // 유료 PDF: 받을 수 있는 파일들(결제완료일 때만)과 다시 받을 수 있는 마지막 날
  files: { key: string; label: string }[];
  downloadUntil: string | null;
  downloadOpen: boolean;
  // 유료 GPT 등 외부 링크(결제완료일 때만)
  link: string | null;
};

export type MyOrder = {
  orderId: string;
  orderName: string;
  amount: number;
  status: string;
  createdAt: string;
  items: MyOrderItem[];
};

export type MyPageData = {
  name: string;
  email: string;
  providers: string[];
  createdAt: string;
  cbt: EntitlementStatus;
  hangul: boolean;
  orders: MyOrder[];
};

const APP_LINKS: Record<EntitlementAlias, { title: string; href: string }> = {
  cbt: { title: '모의 CBT 이용권', href: '/slp-cbt-practice' },
  hangul: { title: '한글놀이 이용권', href: '/hangul' },
};

function memberName(user: User): string {
  const meta = user.user_metadata ?? {};
  return String(meta.name || meta.full_name || meta.nickname || user.email?.split('@')[0] || '회원');
}

function memberProviders(user: User): string[] {
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers) && providers.length > 0) return providers.map(String);
  return user.app_metadata?.provider ? [String(user.app_metadata.provider)] : [];
}

async function orderItems(
  row: { product_slug: unknown; status: unknown; created_at: string },
  appIds: Record<EntitlementAlias, string[]>,
  links: Map<string, string>,
) {
  const done = row.status === 'DONE';
  return Promise.all(
    slugIds(row.product_slug).map(async (id): Promise<MyOrderItem> => {
      const base = { productId: id, href: null, files: [], downloadUntil: null, downloadOpen: false, link: null };
      const alias = (Object.keys(appIds) as EntitlementAlias[]).find((a) => appIds[a].includes(id));
      if (alias) return { ...base, ...APP_LINKS[alias] };
      const product = await getPurchasable(id);
      const files = paidFilesFor(id);
      const until = done && files.length ? downloadUntil(row.created_at) : null;
      return {
        ...base,
        title: product?.title ?? '삭제된 상품',
        files: done ? files.map(({ key, label }) => ({ key, label })) : [],
        downloadUntil: until?.toISOString() ?? null,
        downloadOpen: !!until && until.getTime() > Date.now(),
        link: done ? (links.get(id) ?? null) : null,
      };
    }),
  );
}

export async function getMyPageData(user: User): Promise<MyPageData> {
  const admin = createAdminClient();
  const [cbt, hangul, appIds, resources, orders] = await Promise.all([
    getCbtEntitlement(user.id),
    hasHangulEntitlement(user.id),
    entitlementProductIds(),
    getResourcesCached(),
    admin
      ? admin
          .from('orders')
          .select('order_id, product_slug, order_name, amount, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      : null,
  ]);

  const rows = orders && !orders.error ? (orders.data ?? []) : [];
  // 유료 자료의 링크URL(Notion) — 산 사람에게만 마이페이지에서 보여 준다.
  const links = new Map(
    (resources ?? [])
      .filter((r) => r.type === 'paid' && r.linkUrl)
      .map((r) => [r.id, r.linkUrl as string]),
  );
  const myOrders = await Promise.all(
    rows.map(async (row): Promise<MyOrder> => ({
      orderId: String(row.order_id),
      orderName: String(row.order_name ?? ''),
      amount: Number(row.amount ?? 0),
      status: String(row.status ?? ''),
      createdAt: String(row.created_at),
      items: await orderItems(row, appIds, links),
    })),
  );

  return {
    name: memberName(user),
    email: user.email ?? '',
    providers: memberProviders(user),
    createdAt: user.created_at,
    cbt,
    hangul,
    orders: myOrders,
  };
}
