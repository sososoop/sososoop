import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Search = { [key: string]: string | string[] | undefined };

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const code = one(sp.code);
  const message = one(sp.message);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-[440px] bg-pearl border border-hairline rounded-[18px] p-8 text-center">
        <h1 className="text-[19px] font-bold text-ink mb-2">결제가 취소되었어요</h1>
        <p className="text-[14px] text-ink-muted leading-relaxed mb-2">
          {message || '결제가 완료되지 않았습니다. 다시 시도해 주세요.'}
        </p>
        {code && <p className="text-[12px] text-ink-light mb-6">오류 코드: {code}</p>}
        <div className="mt-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-full bg-primary text-white text-[14px] font-medium"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
