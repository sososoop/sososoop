'use client';

// 상세페이지의 기능 시연 클립. 화면에 보일 때만 받아서 재생하고(데이터 절약),
// '동작 줄이기'를 켠 사람에게는 포스터 이미지만 보여 준다.

import { useEffect, useRef } from 'react';

type Props = {
  name: string; // public/videos/cbt/<name>.mp4 · <name>.webp
  width: number;
  height: number;
  alt: string;
  className?: string;
};

export default function AutoVideo({ name, width, height, alt, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={`/videos/cbt/${name}.mp4`}
      poster={`/videos/cbt/${name}.webp`}
      width={width}
      height={height}
      muted
      loop
      playsInline
      preload="none"
      aria-label={alt}
      className={`block w-full h-auto ${className ?? ''}`}
    />
  );
}
