create table if not exists public.home_office_space_periods (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  effective_from date not null,
  effective_to date,
  home_square_feet numeric(10,2) not null,
  office_square_feet numeric(10,2) not null,
  notes text
);

drop trigger if exists home_office_space_periods_updated_at on public.home_office_space_periods;
create trigger home_office_space_periods_updated_at
before update on public.home_office_space_periods
for each row
execute function public.set_updated_at();

alter table public.home_office_space_periods enable row level security;

drop policy if exists "Home office space periods are private to their owner" on public.home_office_space_periods;
create policy "Home office space periods are private to their owner"
on public.home_office_space_periods
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
