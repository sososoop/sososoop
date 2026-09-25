'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { addToCart, isInCart, CART_EVENT, type CartItem } from '@/lib/cart';

type Props = {
  item: CartItem;
  className: string;
};

// 이용권 소개 화면(LockedPreview)의 [장바구니 담기]. 이미 담겼으면 [장바구니 보기]로 바뀐다.
export default function AddToCartButton({ item, className }: Props) {
  const router = useRouter();
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    const update = () => setInCart(isInCart(item.id));
    update();
    window.addEventListener(CART_EVENT, update);
    return () => window.removeEventListener(CART_EVENT, update);
  }, [item.id]);

  function handleClick() {
    if (inCart) {
      router.push('/cart');
      return;
    }
    addToCart(item);
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {inCart ? '장바구니 보기' : '장바구니 담기'}
    </button>
  );
}
