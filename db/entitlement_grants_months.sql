-- 관리자 지급 이용권: 이용기간(개월) 칸 추가 (2026-10-17)
-- 한글놀이 지급 때 6개월·12개월을 고를 수 있게 했다. 비어 있으면(예전 지급) 기본값으로 센다(한글놀이 12개월, CBT 3개월).
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요. (실행 전에도 사이트는 그대로 돌아가고, 기간을 고른 지급만 안 됩니다)
alter table public.entitlement_grants add column if not exists months smallint;
