import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    // Cloudflare Workers에는 Vercel 이미지 최적화기가 없음.
    // next/image는 로고·about 2곳만 사용하므로 최적화 없이 원본 그대로 제공(양 플랫폼 동일 동작).
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com' },
    ],
  },
  // https로 한 번 들어온 브라우저는 앞으로 http:// 주소도 https로 연다(HSTS).
  // http로 열리면 로그인·기기 확인 쿠키(secure)가 안 실려 CBT가 '다른 기기'로 막혔다(2026-10-14).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }],
      },
    ];
  },
};

export default nextConfig;

// `next dev` 실행 시에만 Cloudflare 바인딩 프록시를 초기화(빌드/프로덕션엔 영향 없음).
initOpenNextCloudflareForDev();
