create table if not exists public.w2_paychecks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  pay_date date not null,
  employer text not null,
  gross_pay numeric(12,2) not null,
  federal_tax_withheld numeric(12,2) not null default 0,
  state_tax_withheld numeric(12,2) not null default 0,
  social_security_withheld numeric(12,2) not null default 0,
  medicare_withheld numeric(12,2) not null default 0,
  other_pre_tax_deductions numeric(12,2) not null default 0,
  other_post_tax_deductions numeric(12,2) not null default 0,
  net_pay numeric(12,2) not null,
  state_code text,
  notes text,
  tax_year int not null,
  tax_quarter int not null check (tax_quarter between 1 and 4)
);

drop trigger if exists w2_paychecks_updated_at on public.w2_paychecks;
create trigger w2_paychecks_updated_at
before update on public.w2_paychecks
for each row
execute function public.set_updated_at();

alter table public.w2_paychecks enable row level security;

drop policy if exists "W2 paychecks are private to their owner" on public.w2_paychecks;
create policy "W2 paychecks are private to their owner"
on public.w2_paychecks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
