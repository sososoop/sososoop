-- 설문 응답 (예: 소수정예 오프라인 CBT 실전 모의훈련 관심자 조사)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- 설문 문항은 코드(src/data/surveys.ts)에 있고, 여기에는 응답만 둔다.

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_slug text not null,             -- src/data/surveys.ts 의 slug
  user_id uuid not null,                 -- 응답한 소소숲 로그인 유저
  email text,
  answers jsonb not null default '{}',   -- { 문항 id: 선택값 또는 선택값 배열 } ('기타: …' 포함)
  name text,                             -- 먼저 안내받기를 원할 때만
  contact text,                          -- 연락처 또는 카카오톡 ID
  agreed_at timestamptz,                 -- 연락처를 남길 때 개인정보 활용 동의 시각
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (survey_slug, user_id)
);

create index if not exists survey_responses_survey_idx
  on public.survey_responses (survey_slug);

alter table public.survey_responses enable row level security;
-- ★보안: 정책을 두지 않는다 → 서버의 service_role 키로만 읽고 쓴다(RLS 우회).
--   응답자 연락처가 공개 anon 키로 새어 나가지 않게 한다.
grant select, insert, update, delete on public.survey_responses to service_role;
