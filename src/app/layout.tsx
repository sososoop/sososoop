import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButton from '@/components/FloatingButton';

const SITE_URL = 'https://sososoop.com';
const ADSENSE_CLIENT = 'ca-pub-1921301097821943';
const SITE_NAME = '소소숲:지혜의 기록소';
const SITE_DESCRIPTION =
  '언어재활사와 교육 전문가들이 배움과 기록을 통해 함께 성장하는 따뜻한 지식 공동체';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: '%s | 소소숲',
  },
  description: SITE_DESCRIPTION,
  keywords: ['언어재활사', 'AI 활용', '교육 콘텐츠', '소소숲', '이승윤', '언어재활사 이승윤'],
  other: {
    // 구글 애드센스 사이트 소유권 인증 메타태그
    'google-adsense-account': ADSENSE_CLIENT,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/images/hero-1.png',
        width: 1672,
        height: 941,
        alt: '소소숲:지혜의 기록소',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ['/images/hero-1.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <FloatingButton />
      </body>
    </html>
  );
}
