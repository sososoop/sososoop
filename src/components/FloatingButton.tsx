'use client';

import { useEffect, useState } from 'react';

export default function FloatingButton() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="상단으로 이동"
          className="w-12 h-12 rounded-full bg-tile-dark text-on-dark flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}
      <a
        href="http://pf.kakao.com/_gngTX"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full bg-[#FEE500] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
        aria-label="고객센터 상담"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#3C1E1E">
          <path d="M12 3C6.477 3 2 6.477 2 11c0 2.85 1.667 5.358 4.207 6.892L5.25 21l4.023-2.116C9.829 19.11 10.9 19.25 12 19.25c5.523 0 10-3.477 10-8.25S17.523 3 12 3z" />
        </svg>
      </a>
    </div>
  );
}
