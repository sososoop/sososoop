-- 유료 자료 파일 보관(비공개 저장소) + 다운로드 기록
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.

-- 1) 비공개 저장소: 공개 주소 없음. 서버가 구매를 확인한 뒤 60초짜리 서명 링크로만 내려준다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('paid-files', 'paid-files', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

-- 2) 다운로드 기록(누가 언제 무엇을 받았는지 — 공유 의심 확인용)
create table if not exists public.download_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  product_id text not null,  -- 결제 상품 id(Notion 페이지 id)
  file_key text not null,    -- 저장소 안 파일 경로
  created_at timestamptz not null default now()
);

create index if not exists download_logs_user_idx on public.download_logs (user_id, created_at desc);

alter table public.download_logs enable row level security;

-- 쓰기·읽기는 서버가 service_role 키로만 한다(클라이언트 정책 없음).
-- 2026-10-30부터 새 표는 Data API 권한이 자동으로 붙지 않으므로 명시한다.
grant select, insert, update, delete on public.download_logs to service_role;
