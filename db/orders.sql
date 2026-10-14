-- 토스 결제 주문 기록 테이블
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,     -- 결제창에 넘긴 orderId
  payment_key text,                  -- 토스 결제 식별자
  user_id uuid,                      -- 결제한 소소숲 로그인 유저(자동 접근·구매여부 판정 근거)
  product_slug text,                 -- 상품 id(들). 장바구니는 콤마로 연결
  order_name text,                   -- 주문명
  amount integer,                    -- 결제 금액(KRW)
  status text,                       -- DONE / WAITING_FOR_DEPOSIT 등
  created_at timestamptz default now()
);

-- 기존 테이블이 있으면 user_id 컬럼 보강(이미 있으면 무시)
alter table public.orders add column if not exists user_id uuid;
create index if not exists orders_user_id_idx on public.orders (user_id);

-- 모의 CBT 이용권 결제 때 받는 휴대폰 번호와 동의 시각(2026-10-14~). 다른 상품 주문은 비어 있다.
alter table public.orders add column if not exists phone text;                       -- 010-1234-5678
alter table public.orders add column if not exists phone_agreed_at timestamptz;      -- [필수] 수집·이용 동의 시각
alter table public.orders add column if not exists marketing_agreed_at timestamptz;  -- [선택] 새 소식 문자 동의 시각(동의 안 하면 null)

alter table public.orders enable row level security;

-- ★보안: 주문 삽입/조회는 서버가 service_role 키로만 수행한다(RLS 우회).
--   anon/authenticated 클라이언트에는 어떤 정책도 주지 않아 공개 anon 키로의
--   가짜 '결제완료' 위조 삽입을 원천 차단한다. (예전 anon insert 정책은 제거)
drop policy if exists "allow insert orders" on public.orders;
