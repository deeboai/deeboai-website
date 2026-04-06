create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'business_kind'
  ) then
    create type public.business_kind as enum ('tutoring', 'consulting', 'other');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  email text,
  username text unique,
  full_name text,
  home_state text,
  current_state text
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  default_mileage_rate numeric(10,4) not null default 0,
  tutoring_tax_reserve_percent numeric(5,2) not null default 30,
  consulting_tax_reserve_percent numeric(5,2) not null default 30,
  other_tax_reserve_percent numeric(5,2) not null default 25,
  w2_annual_income numeric(12,2),
  w2_annual_tax_withheld numeric(12,2),
  home_state text,
  current_state text
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  business_kind public.business_kind not null default 'other',
  default_tax_reserve_percent numeric(5,2) not null default 25,
  is_active boolean not null default true,
  unique (user_id, slug)
);

create table if not exists public.income_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  received_on date not null,
  payer_client text not null,
  income_category text not null,
  gross_amount numeric(12,2) not null,
  fees_withheld numeric(12,2) not null default 0,
  net_received numeric(12,2) not null,
  notes text,
  tax_year int not null,
  tax_quarter int not null check (tax_quarter between 1 and 4)
);

create table if not exists public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  expense_date date not null,
  vendor text not null,
  expense_category text not null,
  description text not null,
  amount numeric(12,2) not null,
  business_use_percent numeric(5,2) not null default 100,
  deductible_amount numeric(12,2) not null,
  payment_method text not null,
  is_recurring boolean not null default false,
  receipt_path text,
  notes text,
  tax_year int not null,
  tax_quarter int not null check (tax_quarter between 1 and 4)
);

create table if not exists public.mileage_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  trip_date date not null,
  purpose text not null,
  origin_location text not null,
  destination_location text not null,
  miles numeric(10,2) not null,
  mileage_rate numeric(10,4) not null,
  deductible_value numeric(12,2) not null,
  is_round_trip boolean not null default false,
  notes text,
  tax_year int not null,
  tax_quarter int not null check (tax_quarter between 1 and 4)
);

create table if not exists public.personal_cashflow_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  category text not null,
  subcategory text,
  amount numeric(12,2) not null,
  notes text,
  entry_month int not null check (entry_month between 1 and 12),
  entry_year int not null
);

create table if not exists public.tax_reserves (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  reserve_date date not null,
  source_income_amount numeric(12,2) not null,
  reserve_percent numeric(5,2) not null,
  reserve_amount numeric(12,2) not null,
  was_transferred boolean not null default false,
  destination_account text,
  notes text,
  tax_year int not null,
  tax_quarter int not null check (tax_quarter between 1 and 4)
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  asset_name text not null,
  purchase_date date not null,
  cost numeric(12,2) not null,
  business_use_percent numeric(5,2) not null default 100,
  business_use_amount numeric(12,2) not null,
  asset_category text not null,
  notes text
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

drop trigger if exists businesses_updated_at on public.businesses;
create trigger businesses_updated_at
before update on public.businesses
for each row
execute function public.set_updated_at();

drop trigger if exists income_entries_updated_at on public.income_entries;
create trigger income_entries_updated_at
before update on public.income_entries
for each row
execute function public.set_updated_at();

drop trigger if exists expense_entries_updated_at on public.expense_entries;
create trigger expense_entries_updated_at
before update on public.expense_entries
for each row
execute function public.set_updated_at();

drop trigger if exists mileage_entries_updated_at on public.mileage_entries;
create trigger mileage_entries_updated_at
before update on public.mileage_entries
for each row
execute function public.set_updated_at();

drop trigger if exists personal_cashflow_entries_updated_at on public.personal_cashflow_entries;
create trigger personal_cashflow_entries_updated_at
before update on public.personal_cashflow_entries
for each row
execute function public.set_updated_at();

drop trigger if exists tax_reserves_updated_at on public.tax_reserves;
create trigger tax_reserves_updated_at
before update on public.tax_reserves
for each row
execute function public.set_updated_at();

drop trigger if exists assets_updated_at on public.assets;
create trigger assets_updated_at
before update on public.assets
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    split_part(coalesce(new.email, ''), '@', 1)
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.businesses enable row level security;
alter table public.income_entries enable row level security;
alter table public.expense_entries enable row level security;
alter table public.mileage_entries enable row level security;
alter table public.personal_cashflow_entries enable row level security;
alter table public.tax_reserves enable row level security;
alter table public.assets enable row level security;

drop policy if exists "Profiles are private to their owner" on public.profiles;
create policy "Profiles are private to their owner"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "User settings are private to their owner" on public.user_settings;
create policy "User settings are private to their owner"
on public.user_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Businesses are private to their owner" on public.businesses;
create policy "Businesses are private to their owner"
on public.businesses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Income entries are private to their owner" on public.income_entries;
create policy "Income entries are private to their owner"
on public.income_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Expense entries are private to their owner" on public.expense_entries;
create policy "Expense entries are private to their owner"
on public.expense_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Mileage entries are private to their owner" on public.mileage_entries;
create policy "Mileage entries are private to their owner"
on public.mileage_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Personal cash flow entries are private to their owner" on public.personal_cashflow_entries;
create policy "Personal cash flow entries are private to their owner"
on public.personal_cashflow_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Tax reserve entries are private to their owner" on public.tax_reserves;
create policy "Tax reserve entries are private to their owner"
on public.tax_reserves
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Assets are private to their owner" on public.assets;
create policy "Assets are private to their owner"
on public.assets
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('expense-receipts', 'expense-receipts', false)
on conflict (id) do nothing;

drop policy if exists "Users can read their own expense receipts" on storage.objects;
create policy "Users can read their own expense receipts"
on storage.objects
for select
using (
  bucket_id = 'expense-receipts'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can upload their own expense receipts" on storage.objects;
create policy "Users can upload their own expense receipts"
on storage.objects
for insert
with check (
  bucket_id = 'expense-receipts'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their own expense receipts" on storage.objects;
create policy "Users can update their own expense receipts"
on storage.objects
for update
using (
  bucket_id = 'expense-receipts'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'expense-receipts'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their own expense receipts" on storage.objects;
create policy "Users can delete their own expense receipts"
on storage.objects
for delete
using (
  bucket_id = 'expense-receipts'
  and auth.uid()::text = (storage.foldername(name))[1]
);
