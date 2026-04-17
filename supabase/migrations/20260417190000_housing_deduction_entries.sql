create table if not exists public.housing_deduction_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  category text not null,
  detail text,
  amount numeric(12,2) not null check (amount >= 0),
  home_state text,
  home_square_feet numeric(10,2),
  office_square_feet numeric(10,2),
  notes text,
  entry_month int not null check (entry_month between 1 and 12),
  entry_year int not null,
  legacy_personal_cashflow_entry_id uuid unique
);

drop trigger if exists housing_deduction_entries_updated_at on public.housing_deduction_entries;
create trigger housing_deduction_entries_updated_at
before update on public.housing_deduction_entries
for each row
execute function public.set_updated_at();

alter table public.housing_deduction_entries enable row level security;

drop policy if exists "Housing deduction entries are private to their owner" on public.housing_deduction_entries;
create policy "Housing deduction entries are private to their owner"
on public.housing_deduction_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into public.housing_deduction_entries (
  user_id,
  entry_date,
  category,
  detail,
  amount,
  home_state,
  home_square_feet,
  office_square_feet,
  notes,
  entry_month,
  entry_year,
  legacy_personal_cashflow_entry_id
)
select
  personal_entry.user_id,
  personal_entry.entry_date,
  personal_entry.category,
  personal_entry.subcategory,
  personal_entry.amount,
  coalesce(home_profile.home_state, planning_profile.home_state) as home_state,
  coalesce(space_period.home_square_feet, home_profile.home_square_feet) as home_square_feet,
  coalesce(space_period.office_square_feet, home_profile.office_square_feet) as office_square_feet,
  personal_entry.notes,
  personal_entry.entry_month,
  personal_entry.entry_year,
  personal_entry.id
from public.personal_cashflow_entries as personal_entry
left join public.home_office_profiles as home_profile
  on home_profile.user_id = personal_entry.user_id
 and home_profile.tax_year = personal_entry.entry_year
left join public.tax_planning_profiles as planning_profile
  on planning_profile.user_id = personal_entry.user_id
 and planning_profile.tax_year = personal_entry.entry_year
left join lateral (
  select
    space.home_square_feet,
    space.office_square_feet
  from public.home_office_space_periods as space
  where space.user_id = personal_entry.user_id
    and space.effective_from <= personal_entry.entry_date
    and (space.effective_to is null or space.effective_to >= personal_entry.entry_date)
  order by space.effective_from desc
  limit 1
) as space_period on true
where personal_entry.category in ('rent', 'electricity', 'utilities', 'internet', 'insurance', 'home maintenance')
on conflict (legacy_personal_cashflow_entry_id) do nothing;
