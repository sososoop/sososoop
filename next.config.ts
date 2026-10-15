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
  // 무료 PDF 파일 이름을 바꿨다(2026-10-15) — 예전 주소로 공유된 링크는 새 파일로 보낸다.
  async redirects() {
    const moved: [string, string][] = [
      ['언어치료·특수교육 AI 활용 프롬프트 50_무료공유_이루다쌤.pdf', '언어치료·특수교육 AI 활용 프롬프트 50_소소숲.pdf'],
      ['유창성장애_출제경향_이루다쌤.pdf', '유창성장애_출제경향_소소숲.pdf'],
    ];
    return moved.map(([from, to]) => ({
      source: `/files/${encodeURIComponent(from)}`,
      destination: `/files/${encodeURIComponent(to)}`,
      permanent: true,
    }));
  },
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
