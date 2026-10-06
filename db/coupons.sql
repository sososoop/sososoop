-- 개인별 1회용 할인 쿠폰(모의 CBT 이용권 전용)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.

create table if not exists public.coupons (
  code text primary key,                 -- 예: CBT-7KQ2-M9XA (대문자)
  product text not null default 'cbt',   -- 적용 상품 별칭
  percent integer not null default 20 check (percent between 1 and 100),
  name text,                             -- 받는 사람
  email text,
  grp text,                              -- 디딤돌 / 베타 등
  created_at timestamptz not null default now(),
  used_at timestamptz,                   -- 결제 승인 직전에 잡고, 승인 실패면 되돌린다
  used_by uuid,
  used_order_id text
);

alter table public.coupons enable row level security;
-- 읽기·쓰기는 서버가 service_role 키로만 한다(클라이언트 정책 없음).
grant select, insert, update, delete on public.coupons to service_role;

-- 주문에 쓴 쿠폰과 할인액 기록
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount integer;
