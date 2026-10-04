import Link from 'next/link';
import type { MyOrder, MyOrderItem, MyPageData } from '@/lib/mypage';
import { formatKoreanDate } from '@/lib/period';
import { formatDate, formatWon, orderStatus, providerLabel } from '@/app/admin/_components/format';

const KAKAO_CHAT = 'http://pf.kakao.com/_gngTX/chat';

type PassCard = {
  title: string;
  state: 'active' | 'ended' | 'none';
  detail: string;
  href: string;
  action: string;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[17px] font-bold text-ink mb-3">{children}</h2>;
}

function PassBadge({ state }: { state: PassCard['state'] }) {
  const style = {
    active: { label: '이용 중', className: 'bg-primary/10 text-primary' },
    ended: { label: '끝남', className: 'bg-stone-100 text-ink-light' },
    none: { label: '없음', className: 'bg-stone-100 text-ink-light' },
  }[state];
  return (
    <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${style.className}`}>
      {style.label}
    </span>
  );
}

function OrderItemRow({ item }: { item: MyOrderItem }) {
  if (item.files.length > 0) {
    const until = item.downloadUntil ? formatKoreanDate(new Date(item.downloadUntil)) : '';
    return (
      <li className="text-[13.5px]">
        <span className="text-ink-muted">{item.title}</span>
        {item.downloadOpen ? (
          <>
            <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap gap-2">
              {item.files.map((file) => (
                <a
                  key={file.key}
                  href={`/mypage/download?product=${encodeURIComponent(item.productId)}&file=${encodeURIComponent(file.key)}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-primary text-white text-[13px] font-semibold hover:bg-primary-dark transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M10 3a1 1 0 011 1v7.59l2.3-2.3a1 1 0 111.4 1.42l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.42L9 11.6V4a1 1 0 011-1zM4 15a1 1 0 011 1h10a1 1 0 112 0 2 2 0 01-2 2H5a2 2 0 01-2-2 1 1 0 011-1z" />
                  </svg>
                  {file.label} PDF
                </a>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-ink-light">{until}까지 다시 받을 수 있어요.</p>
          </>
        ) : (
          <p className="mt-1 text-[12.5px] text-ink-light">다시 받을 수 있는 기간({until}까지)이 끝났어요.</p>
        )}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 text-[13.5px]">
      <span className="text-ink-muted">{item.title}</span>
      {item.href ? (
        <Link href={item.href} className="text-primary font-semibold whitespace-nowrap hover:underline">
          바로 가기 →
        </Link>
      ) : item.link ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold whitespace-nowrap hover:underline"
        >
          열기 →
        </a>
      ) : (
        <a
          href={KAKAO_CHAT}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-muted whitespace-nowrap underline hover:text-ink"
        >
          카카오채널로 받기
        </a>
      )}
    </li>
  );
}

function OrderCard({ order }: { order: MyOrder }) {
  const status = orderStatus(order.status);
  const done = order.status === 'DONE';
  return (
    <div className="bg-pearl border border-hairline rounded-[14px] p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[12.5px] text-ink-light">{formatDate(order.createdAt)}</span>
        <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${status.className}`}>
          {status.label}
        </span>
      </div>
      <div className="flex items-start justify-between gap-4">
        <p className="text-[15px] font-semibold text-ink leading-snug">{order.orderName}</p>
        <span className="text-[15px] font-bold text-ink whitespace-nowrap">{formatWon(order.amount)}</span>
      </div>

      {done && (
        <ul className="mt-3 pt-3 border-t border-hairline flex flex-col gap-3">
          {order.items.map((item, i) => (
            <OrderItemRow key={i} item={item} />
          ))}
        </ul>
      )}

      {order.status === 'WAITING_FOR_DEPOSIT' && (
        <p className="mt-3 pt-3 border-t border-hairline text-[12.5px] text-ink-muted leading-relaxed">
          결제할 때 안내받은 가상계좌로 입금하면 이용이 시작돼요. 기한이 지나면 주문이 자동 취소돼요.
        </p>
      )}

      <p className="mt-2 text-[11px] text-ink-light font-mono">주문번호 {order.orderId}</p>
    </div>
  );
}

const DOWNLOAD_NOTICES: Record<string, string> = {
  notpaid: '결제가 확인된 자료만 받을 수 있어요.',
  expired: '다시 받을 수 있는 기간이 끝났어요. 필요하면 카카오채널로 문의해 주세요.',
  notfound: '찾을 수 없는 파일이에요.',
  error: '파일을 준비하지 못했어요. 잠시 뒤 다시 눌러 주세요.',
};

export default function MyPageView({ data, download }: { data: MyPageData; download?: string }) {
  const notice = download ? DOWNLOAD_NOTICES[download] : undefined;
  const provider = providerLabel(data.providers);

  const passes: PassCard[] = [
    data.cbt.ok
      ? {
          title: '모의 CBT 이용권',
          state: 'active',
          detail: data.cbt.expiresAt ? `${formatKoreanDate(data.cbt.expiresAt)}까지` : '이용할 수 있어요',
          href: '/slp-cbt-practice',
          action: 'CBT 연습앱 열기',
        }
      : data.cbt.expiresAt
        ? {
            title: '모의 CBT 이용권',
            state: 'ended',
            detail: `${formatKoreanDate(data.cbt.expiresAt)}에 끝났어요`,
            href: '/slp-cbt-practice',
            action: '다시 구매하기',
          }
        : {
            title: '모의 CBT 이용권',
            state: 'none',
            detail: '아직 없어요',
            href: '/slp-cbt-practice',
            action: '알아보기',
          },
    data.hangul
      ? {
          title: '한글놀이 이용권',
          state: 'active',
          detail: '이용할 수 있어요',
          href: '/hangul',
          action: '한글놀이 열기',
        }
      : {
          title: '한글놀이 이용권',
          state: 'none',
          detail: '아직 없어요',
          href: '/hangul',
          action: '알아보기',
        },
  ];

  return (
    <main className="bg-canvas py-12 px-5 md:px-6 min-h-[70vh]">
      <div className="max-w-[760px] mx-auto flex flex-col gap-10">
        <h1 className="text-[26px] font-bold text-ink">마이페이지</h1>

        {notice && (
          <p className="-mt-4 rounded-[12px] bg-amber-50 border border-amber-200 px-4 py-3 text-[13.5px] text-amber-800">
            {notice}
          </p>
        )}

        {/* 내 정보 */}
        <section>
          <SectionTitle>내 정보</SectionTitle>
          <div className="bg-pearl border border-hairline rounded-[18px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[19px] font-bold text-ink">{data.name}님</p>
                <p className="text-[13.5px] text-ink-muted mt-1 break-all">{data.email || '이메일 없음'}</p>
              </div>
              <form action="/auth/signout" method="post" className="shrink-0">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full border border-hairline text-[13px] text-ink-muted hover:text-ink hover:bg-white transition-colors"
                >
                  로그아웃
                </button>
              </form>
            </div>
            <dl className="mt-5 pt-5 border-t border-hairline grid grid-cols-[88px_1fr] gap-y-2 text-[13.5px]">
              <dt className="text-ink-light">로그인 방식</dt>
              <dd className="text-ink font-semibold">{provider} 계정</dd>
              <dt className="text-ink-light">가입일</dt>
              <dd className="text-ink">{formatDate(data.createdAt)}</dd>
            </dl>
            <p className="mt-4 rounded-[10px] bg-white border border-hairline px-4 py-3 text-[12.5px] text-ink-muted leading-relaxed">
              다음에도 <strong className="text-ink">{provider} 계정</strong>으로 로그인해야 이용권과
              구매내역이 보여요. 다른 계정으로 로그인하면 새 회원으로 들어가요.
            </p>
          </div>
        </section>

        {/* 내 이용권 */}
        <section>
          <SectionTitle>내 이용권</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            {passes.map((pass) => (
              <div
                key={pass.title}
                className="bg-pearl border border-hairline rounded-[14px] p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold text-ink">{pass.title}</span>
                  <PassBadge state={pass.state} />
                </div>
                <p className="text-[13.5px] text-ink-muted">{pass.detail}</p>
                <Link
                  href={pass.href}
                  className={`mt-auto text-center py-2.5 rounded-full text-[13.5px] font-semibold transition-colors ${
                    pass.state === 'active'
                      ? 'bg-primary text-white hover:bg-primary-dark'
                      : 'border border-hairline text-ink-muted hover:text-ink hover:bg-white'
                  }`}
                >
                  {pass.action}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* 구매내역 */}
        <section>
          <SectionTitle>구매내역</SectionTitle>
          {data.orders.length === 0 ? (
            <div className="bg-pearl border border-hairline rounded-[18px] p-10 text-center">
              <p className="text-[14.5px] text-ink-muted mb-5">아직 구매한 상품이 없어요.</p>
              <Link
                href="/resources"
                className="inline-block px-6 py-2.5 rounded-full bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-dark transition-colors"
              >
                자료실 둘러보기
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.orders.map((order) => (
                <OrderCard key={order.orderId} order={order} />
              ))}
              <p className="text-[12px] text-ink-light leading-relaxed">
                받기 버튼이 없는 자료·강의는 카카오채널로 보내 드려요. 아직 받지 못했다면 주문번호와 함께
                문의해 주세요.
              </p>
            </div>
          )}
        </section>

        <p className="text-center text-[12px] text-ink-light">
          회원 탈퇴를 원하면{' '}
          <a href={KAKAO_CHAT} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-muted">
            카카오채널
          </a>
          로 문의해 주세요.
        </p>
      </div>
    </main>
  );
}
