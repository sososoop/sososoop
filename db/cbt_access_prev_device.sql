-- CBT 기기 확인: 직전 번호 칸 추가 (2026-10-14)
-- 들어올 때마다 기기 번호를 바꾸는데, 바뀐 번호가 브라우저에 저장되기 전에 창을 닫거나 연결이 끊기면
-- 같은 기기인데도 '다른 기기'로 막혔다. 새 번호가 아직 한 번도 쓰이지 않았으면 직전 번호를 인정한다.
-- 앱(/slp-cbt-practice/app)이 새 번호로 열리면 이 칸은 비운다.
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
alter table public.cbt_access add column if not exists prev_device_id text;
