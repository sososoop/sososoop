import Link from 'next/link';
import { ENTITLEMENT_PRODUCTS, isEntitlementActive } from '@/lib/entitlements';
import { formatKoreanDate } from '@/lib/period';
import type { MemberDetail } from '@/lib/admin-data';
import { changeOrderStatus, grantEntitlement, resetCbtDevice, revokeGrant } from '../actions';
import ConfirmSubmit from './ConfirmSubmit';
import GrantsTableNotice from './GrantsTableNotice';
import { formatDateTime, formatWon, orderStatus, providerLabel } from './format';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-pearl rounded-[18px] border border-hairline p-6">
      <h2 className="text-[17px] font-semibold text-ink mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function MemberDetailView({ detail }: { detail: MemberDetail }) {
  const { member, orders, grants, access, grantsTableReady } = detail;

  const info = [
    { label: '이메일', value: member.email || '(이메일 없음)' },
    { label: '로그인 방식', value: providerLabel(member.providers) },
    { label: '가입일', value: formatDateTime(member.createdAt) },
    { label: '마지막 접속', value: formatDateTime(member.lastSignInAt) },
    { label: '누적 결제액', value: formatWon(member.paidTotal) },
    { label: '회원 ID', value: member.id },
  ];

  return (
    <main className="max-w-[1120px] mx-auto px-6 py-10">
      <Link href="/admin" className="inline-block text-[13px] text-ink-muted hover:text-primary mb-4">
        ← 회원 목록
      </Link>
      <h1 className="text-[24px] font-semibold text-ink mb-6">{member.name}</h1>

      {!grantsTableReady && <GrantsTableNotice />}

      <div className="flex flex-col gap-5">
        <Section title="기본 정보">
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-[14px]">
            {info.map((row) => (
              <div key={row.label} className="flex gap-3 min-w-0">
                <dt className="w-24 shrink-0 text-ink-muted">{row.label}</dt>
                <dd className="text-ink break-all">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="이용권">
          <div className="flex flex-col divide-y divide-hairline">
            {ENTITLEMENT_PRODUCTS.map(({ alias, label }) => {
              const sources = member.entitlements[alias];
              const activeGrant = grants.find(
                (g) => g.product === alias && !g.revoked_at && isEntitlementActive(alias, g.granted_at),
              );
              const expiresAt = member.expiresAt[alias];
              const until = expiresAt ? formatKoreanDate(new Date(expiresAt)) : null;
              return (
                <div key={alias} className="py-4 first:pt-0 last:pb-0 flex flex-wrap items-center gap-3">
                  <span className="w-24 shrink-0 text-[15px] font-medium text-ink">{label}</span>
                  <span className="flex-1 min-w-[160px] text-[14px] text-ink-muted">
                    {sources.length === 0
                      ? until
                        ? `없음 (${until} 기간 끝남)`
                        : '없음'
                      : [
                          sources.includes('paid') && '결제로 보유',
                          activeGrant &&
                            `관리자 지급 (${formatDateTime(activeGrant.granted_at)}${
                              activeGrant.note ? ` · ${activeGrant.note}` : ''
                            })`,
                          until && `${until}까지`,
                        ]
                          .filter(Boolean)
                          .join(' / ')}
                  </span>

                  {activeGrant ? (
                    <form action={revokeGrant}>
                      <input type="hidden" name="userId" value={member.id} />
                      <input type="hidden" name="grantId" value={activeGrant.id} />
                      <ConfirmSubmit
                        tone="danger"
                        message={`${member.name}님의 ${label} 지급을 취소할까요?${
                          sources.includes('paid') ? '\n(결제로 산 이용권은 그대로 남습니다)' : ''
                        }`}
                      >
                        지급 취소
                      </ConfirmSubmit>
                    </form>
                  ) : (
                    grantsTableReady && (
                      <form action={grantEntitlement} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="userId" value={member.id} />
                        <input type="hidden" name="product" value={alias} />
                        <input
                          type="text"
                          name="note"
                          maxLength={200}
                          placeholder="지급 사유 (예: 계좌이체 입금)"
                          className="w-[220px] max-w-full px-3 py-1.5 rounded-full border border-hairline bg-canvas text-[13px] text-ink focus:outline-none focus:border-primary"
                        />
                        <ConfirmSubmit tone="primary" message={`${member.name}님에게 ${label} 이용권을 지급할까요?`}>
                          이용권 지급
                        </ConfirmSubmit>
                      </form>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="모의 CBT 기기">
          {access ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex-1 min-w-[200px] text-[14px] text-ink-muted">
                {formatDateTime(access.bound_at)}에 등록된 기기 1대
                <span className="ml-2 text-[12px] text-ink-light">({access.device_id.slice(0, 8)}…)</span>
              </p>
              <form action={resetCbtDevice}>
                <input type="hidden" name="userId" value={member.id} />
                <ConfirmSubmit
                  tone="danger"
                  message={`${member.name}님의 CBT 기기 등록을 초기화할까요?\n다음에 접속하는 기기가 새로 등록됩니다.`}
                >
                  기기 초기화
                </ConfirmSubmit>
              </form>
            </div>
          ) : (
            <p className="text-[14px] text-ink-muted">등록된 기기가 없어요. 처음 접속하는 기기가 자동으로 등록됩니다.</p>
          )}
        </Section>

        <Section title={`주문 내역 (${orders.length})`}>
          {orders.length === 0 ? (
            <p className="text-[14px] text-ink-muted">주문 내역이 없어요.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-[14px]">
                  <thead className="text-[12px] text-ink-muted">
                    <tr>
                      <th className="py-2 pr-4 font-medium">일시</th>
                      <th className="py-2 pr-4 font-medium">주문명</th>
                      <th className="py-2 pr-4 font-medium text-right">금액</th>
                      <th className="py-2 pr-4 font-medium">상태</th>
                      <th className="py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const status = orderStatus(o.status);
                      return (
                        <tr key={o.id} className="border-t border-hairline">
                          <td className="py-3 pr-4 text-ink-muted whitespace-nowrap">{formatDateTime(o.created_at)}</td>
                          <td className="py-3 pr-4 text-ink">
                            {o.order_name ?? '-'}
                            <span className="block text-[11px] text-ink-light">{o.order_id}</span>
                          </td>
                          <td className="py-3 pr-4 text-right text-ink whitespace-nowrap">{formatWon(o.amount)}</td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-0.5 rounded-full text-[12px] font-medium whitespace-nowrap ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {o.status === 'WAITING_FOR_DEPOSIT' && (
                              <form action={changeOrderStatus}>
                                <input type="hidden" name="userId" value={member.id} />
                                <input type="hidden" name="orderRowId" value={o.id} />
                                <input type="hidden" name="next" value="DONE" />
                                <ConfirmSubmit
                                  tone="primary"
                                  message={`토스에서 입금이 확인됐나요?\n「${o.order_name ?? ''}」을 결제완료로 바꾸고 이용권을 열어줍니다.`}
                                >
                                  입금 확인
                                </ConfirmSubmit>
                              </form>
                            )}
                            {o.status === 'DONE' && (
                              <form action={changeOrderStatus}>
                                <input type="hidden" name="userId" value={member.id} />
                                <input type="hidden" name="orderRowId" value={o.id} />
                                <input type="hidden" name="next" value="CANCELED" />
                                <ConfirmSubmit
                                  tone="danger"
                                  message={`「${o.order_name ?? ''}」을 환불 처리할까요?\n이 주문으로 받은 이용권이 회수됩니다.\n※ 실제 환불은 토스 대시보드에서 따로 해야 합니다.`}
                                >
                                  환불 처리
                                </ConfirmSubmit>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[12px] text-ink-light leading-relaxed">
                환불 처리는 기록만 바꿉니다. 카드 취소·계좌 환불은 토스 대시보드에서 먼저 진행해 주세요.
              </p>
            </>
          )}
        </Section>
      </div>
    </main>
  );
}
