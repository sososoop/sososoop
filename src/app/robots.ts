import type { MetadataRoute } from 'next';

const SITE_URL = 'https://sososoop.com';

// 검색엔진(네이버 Yeti·구글 등)이 공개 페이지는 모두 읽고,
// 로그인·결제·관리자 화면은 건너뛰도록 한다. 사이트맵 위치도 알려준다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/mypage',
          '/cart',
          '/checkout',
          '/payments',
          '/auth',
          '/login',
          '/survey',
          '/api',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
