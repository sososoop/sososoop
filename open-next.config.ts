import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import kvNextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/kv-next-tag-cache";

// 증분 캐시(KV) + 리전 캐시(Cache API).
// ISR/SSG 페이지(홈·강의)를 KV에 캐시해 매 요청 풀 SSR을 피한다.
// 캐시 히트는 react-dom 렌더 없이 반환 → 워커 CPU/메모리 급감(콜드 스타트 1102 완화).
// 시간 기반 갱신은 껐다(KV 쓰기 무료 한도 1,000건/일 초과 방지). Notion 변경은
// 관리자 화면 '사이트 새로고침'(revalidatePath/revalidateTag)으로 반영 — 그 기록은 태그 캐시(KV)에 남는다.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(kvIncrementalCache, { mode: "long-lived" }),
  tagCache: kvNextTagCache,
});
