'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { addToCart, isInCart, CART_EVENT } from '@/lib/cart';

type Props = {
  id: string;
  title: string;
  price: number;
  image?: string;
};

export default function BuyButtons({ id, title, price, image }: Props) {
  const router = useRouter();
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    const update = () => setInCart(isInCart(id));
    update();
    window.addEventListener(CART_EVENT, update);
    return () => window.removeEventListener(CART_EVENT, update);
  }, [id]);

  function buyNow() {
    router.push(`/checkout?product=${id}`);
  }

  function handleCart() {
    if (inCart) {
      router.push('/cart');
      return;
    }
    addToCart({ id, title, price, image });
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        onClick={buyNow}
        className="w-full py-3.5 rounded-full bg-primary text-white text-[16px] font-semibold hover:bg-primary-dark transition-colors active:scale-[0.99]"
      >
        구매하기
      </button>
      <button
        onClick={handleCart}
        className="w-full py-3.5 rounded-full border border-primary bg-white text-primary text-[16px] font-semibold hover:bg-primary/5 transition-colors active:scale-[0.99]"
      >
        {inCart ? '장바구니 보기' : '장바구니 담기'}
      </button>
      {inCart && (
        <p className="text-[12px] text-primary text-center">장바구니에 담았어요.</p>
      )}
    </div>
  );
}
