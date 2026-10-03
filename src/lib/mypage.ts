// 마이페이지 데이터 — 서버 전용. 로그인한 본인의 이용권·구매내역만 읽는다.
import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPurchasable } from '@/lib/products';
import {
  entitlementProductIds,
  getCbtEntitlement,
  hasHangulEntitlement,
  slugIds,
  type EntitlementAlias,
  type EntitlementStatus,
} from '@/lib/entitlements';

export type MyOrderItem = {
  title: string;
  // 이용권이면 바로 가는 주소, 자료·강의면 null(카카오채널로 전달)
  href: string | null;
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

async function orderItems(productSlug: unknown, appIds: Record<EntitlementAlias, string[]>) {
  return Promise.all(
    slugIds(productSlug).map(async (id): Promise<MyOrderItem> => {
      const alias = (Object.keys(appIds) as EntitlementAlias[]).find((a) => appIds[a].includes(id));
      if (alias) return APP_LINKS[alias];
      const product = await getPurchasable(id);
      return { title: product?.title ?? '삭제된 상품', href: null };
    }),
  );
}

export async function getMyPageData(user: User): Promise<MyPageData> {
  const admin = createAdminClient();
  const [cbt, hangul, appIds, orders] = await Promise.all([
    getCbtEntitlement(user.id),
    hasHangulEntitlement(user.id),
    entitlementProductIds(),
    admin
      ? admin
          .from('orders')
          .select('order_id, product_slug, order_name, amount, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      : null,
  ]);

  const rows = orders && !orders.error ? (orders.data ?? []) : [];
  const myOrders = await Promise.all(
    rows.map(async (row): Promise<MyOrder> => ({
      orderId: String(row.order_id),
      orderName: String(row.order_name ?? ''),
      amount: Number(row.amount ?? 0),
      status: String(row.status ?? ''),
      createdAt: String(row.created_at),
      items: await orderItems(row.product_slug, appIds),
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
