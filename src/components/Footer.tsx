import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-parchment border-t border-hairline">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <p className="text-[14px] font-semibold text-ink">소소숲:지혜의 기록소</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-ink mb-1">바로가기</p>
            {[
              { label: '소소숲 소개', href: '/about' },
              { label: '자료실', href: '/resources' },
              { label: '강의', href: '/lectures' },
              { label: '한글놀이', href: '/hangul' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[12px] text-ink-muted hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <a
              href="http://pf.kakao.com/_gngTX"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold text-ink hover:text-primary transition-colors"
            >
              고객센터
            </a>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-hairline flex flex-col md:flex-row justify-between gap-2">
          <div>
            <p className="text-[10px] text-ink-light">
              © 2026 소소숲:지혜의 기록소. All rights reserved.
            </p>
            <div className="text-[10px] text-ink-light mt-2 leading-relaxed space-y-0.5">
              <p>상호명: 소소숲 · 대표자: 이승윤 · 사업자등록번호: 203-33-40593</p>
              <p>통신판매업신고번호: 제2026-서울강남-05359호</p>
              <p>사업장 주소: 서울특별시 강남구 개포로 264, 126-2503</p>
              <p>
                전화: <a href="tel:010-5668-8046" className="hover:text-ink transition-colors">010-5668-8046</a>
                {' '}· 문의: 카카오채널 @소소숲
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/terms" className="text-[10px] text-ink-light hover:text-ink transition-colors">
              이용약관
            </Link>
            <Link href="/privacy" className="text-[10px] text-ink-light hover:text-ink transition-colors">
              개인정보처리방침
            </Link>
            <Link href="/refund" className="text-[10px] text-ink-light hover:text-ink transition-colors">
              환불정책
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
