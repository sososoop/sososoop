import Link from 'next/link';

const menuItems = [
  { label: '자료실', href: '/resources', emoji: '📂' },
  { label: '강의 신청', href: '/lectures', emoji: '🎓' },
  { label: '한글놀이', href: '/hangul', emoji: '🌱' },
  { label: '소소숲 소개', href: '/about', emoji: '🌲' },
  { label: '고객센터', href: 'http://pf.kakao.com/_gngTX', emoji: '💬', external: true },
  { label: '인스타그램', href: 'https://instagram.com/slp_irudassam', emoji: '📸', external: true },
];

export default function QuickMenu() {
  return (
    <section className="bg-canvas border-b border-hairline">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <ul className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className="flex flex-col items-center gap-2 group"
              >
                <span className="w-14 h-14 rounded-full bg-parchment flex items-center justify-center text-2xl group-hover:bg-primary/10 transition-colors">
                  {item.emoji}
                </span>
                <span className="text-[12px] text-ink-muted group-hover:text-primary transition-colors text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
