-- 무료 LIVE 신청 (예: 언어재활사 CBT 실전 적응 무료 LIVE)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- LIVE 소개 문구·일정은 코드(src/data/freeLives.ts)에 있고, 여기에는 신청 기록과 ZOOM 링크만 둔다.

-- LIVE별 ZOOM 링크(관리자 화면에서 입력 → 신청자 마이페이지에만 보임)
create table if not exists public.free_live_events (
  slug text primary key,                 -- src/data/freeLives.ts 의 slug
  zoom_url text,
  zoom_note text,                        -- 회의 ID·암호 등 함께 보여 줄 메모
  updated_at timestamptz not null default now()
);

create table if not exists public.free_live_registrations (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null,
  user_id uuid not null,                 -- 신청한 소소숲 로그인 유저
  email text,
  name text not null,
  phone text not null,
  instagram text,
  exam text,                             -- 준비 중인 시험(1급·2급·기타 입력값)
  worries text[] not null default '{}',  -- CBT에서 걱정되는 부분(복수)
  question text,                         -- LIVE에서 묻고 싶은 질문
  offline_interest text,                 -- 오프라인 모의훈련 관심
  agreed_at timestamptz not null,        -- 개인정보 활용 동의 시각
  created_at timestamptz not null default now(),
  canceled_at timestamptz,               -- 본인이 취소하면 기록(null 이면 유효)
  unique (event_slug, user_id)
);

create index if not exists free_live_registrations_event_idx
  on public.free_live_registrations (event_slug);

alter table public.free_live_events enable row level security;
alter table public.free_live_registrations enable row level security;
-- ★보안: 정책을 두지 않는다 → 서버의 service_role 키로만 읽고 쓴다(RLS 우회).
--   ZOOM 링크와 신청자 연락처가 공개 anon 키로 새어 나가지 않게 한다.
grant select, insert, update, delete on public.free_live_events to service_role;
grant select, insert, update, delete on public.free_live_registrations to service_role;
