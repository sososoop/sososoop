-- CBT 기기: 본인이 직접 옮긴 날 칸 추가 (2026-10-15)
-- '다른 기기' 화면의 [이 기기로 옮기기]로 회원이 직접 기기를 바꿀 수 있게 했다. 옮긴 날부터 14일 동안은 다시 못 옮긴다.
-- 처음 등록(bound_at)은 횟수에 치지 않는다. 관리자 [기기 초기화]는 행을 지우므로 이 기록도 함께 없어진다.
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요. (배포 전에 먼저 실행)
alter table public.cbt_access add column if not exists moved_at timestamptz;
