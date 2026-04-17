create table if not exists public.housing_monthly_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  base_rent numeric(12,2) not null default 0 check (base_rent >= 0),
  parking numeric(12,2) not null default 0 check (parking >= 0),
  utilities numeric(12,2) not null default 0 check (utilities >= 0),
  insurance numeric(12,2) not null default 0 check (insurance >= 0),
  maintenance numeric(12,2) not null default 0 check (maintenance >= 0),
  home_state text,
  home_square_feet numeric(10,2),
  office_square_feet numeric(10,2),
  notes text,
  entry_month int not null check (entry_month between 1 and 12),
  entry_year int not null,
  unique (user_id, entry_year, entry_month)
);

drop trigger if exists housing_monthly_entries_updated_at on public.housing_monthly_entries;
create trigger housing_monthly_entries_updated_at
before update on public.housing_monthly_entries
for each row
execute function public.set_updated_at();

alter table public.housing_monthly_entries enable row level security;

drop policy if exists "Housing monthly entries are private to their owner" on public.housing_monthly_entries;
create policy "Housing monthly entries are private to their owner"
on public.housing_monthly_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into public.housing_monthly_entries (
  user_id,
  entry_date,
  base_rent,
  parking,
  utilities,
  insurance,
  maintenance,
  home_state,
  home_square_feet,
  office_square_feet,
  notes,
  entry_month,
  entry_year
)
select
  grouped.user_id,
  grouped.entry_date,
  grouped.base_rent,
  0 as parking,
  grouped.utilities,
  grouped.insurance,
  grouped.maintenance,
  grouped.home_state,
  grouped.home_square_feet,
  grouped.office_square_feet,
  grouped.notes,
  grouped.entry_month,
  grouped.entry_year
from (
  select
    entry.user_id,
    max(entry.entry_date) as entry_date,
    round(sum(case when entry.category = 'rent' then entry.amount else 0 end)::numeric, 2) as base_rent,
    round(sum(case when entry.category in ('utilities', 'electricity', 'internet') then entry.amount else 0 end)::numeric, 2) as utilities,
    round(sum(case when entry.category = 'insurance' then entry.amount else 0 end)::numeric, 2) as insurance,
    round(sum(case when entry.category = 'home maintenance' then entry.amount else 0 end)::numeric, 2) as maintenance,
    (
      array_remove(
        array_agg(entry.home_state order by entry.entry_date desc) filter (where entry.home_state is not null),
        null
      )
    )[1] as home_state,
    (
      array_remove(
        array_agg(entry.home_square_feet order by entry.entry_date desc) filter (where entry.home_square_feet is not null),
        null
      )
    )[1] as home_square_feet,
    (
      array_remove(
        array_agg(entry.office_square_feet order by entry.entry_date desc) filter (where entry.office_square_feet is not null),
        null
      )
    )[1] as office_square_feet,
    case
      when count(*) > 0 then 'Backfilled from prior housing bill entries.'
      else null
    end as notes,
    entry.entry_month,
    entry.entry_year
  from public.housing_deduction_entries as entry
  group by entry.user_id, entry.entry_year, entry.entry_month
) as grouped
on conflict (user_id, entry_year, entry_month) do nothing;
