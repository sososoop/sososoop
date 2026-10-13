import BuyButtons from '@/components/BuyButtons';

type Props = {
  productId: string;
  title: string;
  price: number;
  image?: string;
  badge?: string; // 예: '모집중'
  note?: string; // 버튼 아래 안내 문구
};

// 강의 상세페이지 우측의 구매 박스. 구매하기 / 장바구니 버튼 제공.
export default function PurchaseBox({
  productId,
  title,
  price,
  image,
  badge = '모집중',
  note = '이용기간: 결제일로부터 6개월 · 토스페이먼츠 안전결제',
}: Props) {
  return (
    <aside id="apply" className="lg:sticky lg:top-24 flex flex-col gap-6 scroll-mt-24">
      <div className="bg-canvas rounded-[18px] p-6 border border-hairline">
        <span className="inline-block text-[12px] font-semibold text-primary mb-3">{badge}</span>
        <h2 className="text-[18px] font-semibold text-ink leading-snug mb-4">{title}</h2>

        <div className="flex items-center justify-between mb-5 pb-5 border-b border-hairline">
          <span className="text-[13px] text-ink-muted">총 상품금액 (1개)</span>
          <span className="text-[24px] font-bold text-ink">{price.toLocaleString()}원</span>
        </div>

        <BuyButtons id={productId} title={title} price={price} image={image} />

        <p className="text-[12px] text-ink-light text-center mt-3 leading-relaxed">{note}</p>
      </div>

      <div className="bg-canvas rounded-[18px] p-6 border border-hairline">
        <p className="text-[14px] font-semibold text-ink mb-3">문의</p>
        <p className="text-[14px] text-ink-muted mb-4">궁금한 점은 고객센터로 문의해주세요.</p>
        <a
          href="http://pf.kakao.com/_gngTX"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FEE500] text-[#3C1E1E] text-[14px] font-semibold hover:opacity-90 transition-opacity"
        >
          고객센터 문의하기
        </a>
      </div>
    </aside>
  );
}
