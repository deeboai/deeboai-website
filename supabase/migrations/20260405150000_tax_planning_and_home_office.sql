create table if not exists public.tax_planning_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_year int not null,
  filing_status text not null default 'single',
  home_state text,
  prior_year_agi numeric(12,2),
  prior_year_federal_total_tax numeric(12,2),
  prior_year_state_total_tax numeric(12,2),
  annual_w2_withholding_expected numeric(12,2) not null default 0,
  annual_other_withholding_expected numeric(12,2) not null default 0,
  tax_season_reviewed_at date,
  notes text,
  unique (user_id, tax_year)
);

create table if not exists public.home_office_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_year int not null,
  home_state text,
  method_preference text not null default 'auto',
  exclusive_use_confirmed boolean not null default false,
  principal_place_confirmed boolean not null default false,
  home_square_feet numeric(10,2),
  office_square_feet numeric(10,2),
  qualifying_months int not null default 12 check (qualifying_months between 1 and 12),
  monthly_rent numeric(12,2) not null default 0,
  monthly_utilities numeric(12,2) not null default 0,
  monthly_internet numeric(12,2) not null default 0,
  monthly_renters_insurance numeric(12,2) not null default 0,
  monthly_home_maintenance numeric(12,2) not null default 0,
  direct_office_expenses numeric(12,2) not null default 0,
  notes text,
  unique (user_id, tax_year)
);

alter table public.tax_reserves
  add column if not exists counts_as_federal_estimated_payment boolean not null default false;

alter table public.tax_reserves
  add column if not exists counts_as_state_estimated_payment boolean not null default false;

drop trigger if exists tax_planning_profiles_updated_at on public.tax_planning_profiles;
create trigger tax_planning_profiles_updated_at
before update on public.tax_planning_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists home_office_profiles_updated_at on public.home_office_profiles;
create trigger home_office_profiles_updated_at
before update on public.home_office_profiles
for each row
execute function public.set_updated_at();

alter table public.tax_planning_profiles enable row level security;
alter table public.home_office_profiles enable row level security;

drop policy if exists "Tax planning profiles are private to their owner" on public.tax_planning_profiles;
create policy "Tax planning profiles are private to their owner"
on public.tax_planning_profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Home office profiles are private to their owner" on public.home_office_profiles;
create policy "Home office profiles are private to their owner"
on public.home_office_profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
