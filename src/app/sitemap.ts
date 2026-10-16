import type { MetadataRoute } from 'next';
import { lectures } from '@/data/lectures';
import { freeResources, paidResources } from '@/data/resources';
import { FREE_LIVES } from '@/data/freeLives';

const SITE_URL = 'https://sososoop.com';

// 검색엔진에 알려줄 공개 페이지 목록. 코드에 있는 정적 데이터만 쓴다
// (Notion 조회는 하지 않는다 — 빌드 때 한 번 만들어지고 KV 쓰기를 늘리지 않도록).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (p: string) => `${SITE_URL}${p}`;

  const fixed: MetadataRoute.Sitemap = [
    { url: url('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: url('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: url('/lectures'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: url('/resources'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: url('/resources/games'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: url('/slp-cbt-practice'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: url('/slp-cbt-practice/guide'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: url('/slp-cbt-practice/faq'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: url('/hangul'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: url('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: url('/refund'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const lecturePages: MetadataRoute.Sitemap = lectures.map((l) => ({
    url: url(`/lectures/${l.id}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const livePages: MetadataRoute.Sitemap = FREE_LIVES.map((live) => ({
    url: url(`/lectures/live/${live.slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const resourcePages: MetadataRoute.Sitemap = [...freeResources, ...paidResources].map((r) => ({
    url: url(`/resources/${r.id}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...fixed, ...lecturePages, ...livePages, ...resourcePages];
}
