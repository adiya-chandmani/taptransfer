-- TapTransfer MVP 스키마 (PRD 32장)
-- Supabase 대시보드 > SQL Editor 에 그대로 붙여넣어 실행한다.

-- PRD 32: merchants
create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,
  business_name text not null,
  bank_name text not null,
  -- 은행마다 자릿수/구분 규칙이 달라 관리자가 입력한 표기를 그대로 저장한다 (PRD 8, 9장).
  -- 복사 시에는 애플리케이션에서 숫자만 남긴다.
  account_number text not null,
  account_holder text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PRD 32: page_views
create table if not exists public.page_views (
  id bigserial primary key,
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  source text not null default 'direct' check (source in ('nfc', 'qr', 'direct')),
  created_at timestamptz not null default now()
);

create index if not exists page_views_merchant_created_idx
  on public.page_views (merchant_id, created_at desc);

-- PRD 21: 계좌정보 변경 이력. 오송금 분쟁 시 추적용.
create table if not exists public.merchant_audit_log (
  id bigserial primary key,
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  changed_field text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now()
);

create index if not exists merchant_audit_log_merchant_idx
  on public.merchant_audit_log (merchant_id, changed_at desc);

-- PRD 16: 관리자 로그인 5회 실패 시 잠금.
create table if not exists public.login_attempts (
  email text primary key,
  failed_count integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

-- PRD 33: DB 직접 접근 금지.
-- RLS를 켜되 정책을 하나도 만들지 않는다. anon/authenticated 키로는 어떤 행도 읽거나 쓸 수 없고,
-- RLS를 우회하는 service_role 키를 쓰는 서버 코드만 접근할 수 있다.
alter table public.merchants enable row level security;
alter table public.page_views enable row level security;
alter table public.merchant_audit_log enable row level security;
alter table public.login_attempts enable row level security;

-- PRD 24: 판매자별 조회 통계.
-- 새로고침/재방문을 포함한 단순 페이지뷰 수이며 순 방문자 수(UV)가 아니다.
create or replace function public.merchant_stats()
returns table (
  merchant_id uuid,
  today_count bigint,
  week_count bigint,
  total_count bigint,
  last_viewed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id as merchant_id,
    count(v.id) filter (
      where v.created_at >= (date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul')
    ) as today_count,
    count(v.id) filter (where v.created_at >= now() - interval '7 days') as week_count,
    count(v.id) as total_count,
    max(v.created_at) as last_viewed_at
  from public.merchants m
  left join public.page_views v on v.merchant_id = m.id
  group by m.id;
$$;

revoke all on function public.merchant_stats() from public, anon, authenticated;

-- updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists merchants_touch_updated_at on public.merchants;
create trigger merchants_touch_updated_at
  before update on public.merchants
  for each row execute function public.touch_updated_at();
