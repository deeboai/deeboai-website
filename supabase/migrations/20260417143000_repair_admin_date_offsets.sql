do $$
declare
  safe_cutoff timestamptz := timezone('utc', now()) - interval '1 hour';
begin
  update public.income_entries
  set
    received_on = received_on + 1,
    tax_year = extract(year from received_on + 1)::int,
    tax_quarter = extract(quarter from received_on + 1)::int
  where created_at < safe_cutoff;

  update public.expense_entries
  set
    expense_date = expense_date + 1,
    tax_year = extract(year from expense_date + 1)::int,
    tax_quarter = extract(quarter from expense_date + 1)::int
  where created_at < safe_cutoff;

  update public.mileage_entries
  set
    trip_date = trip_date + 1,
    tax_year = extract(year from trip_date + 1)::int,
    tax_quarter = extract(quarter from trip_date + 1)::int
  where created_at < safe_cutoff;

  update public.personal_cashflow_entries
  set
    entry_date = entry_date + 1,
    entry_month = extract(month from entry_date + 1)::int,
    entry_year = extract(year from entry_date + 1)::int
  where created_at < safe_cutoff;

  update public.tax_reserves
  set
    reserve_date = reserve_date + 1,
    tax_year = extract(year from reserve_date + 1)::int,
    tax_quarter = extract(quarter from reserve_date + 1)::int
  where created_at < safe_cutoff;

  update public.assets
  set purchase_date = purchase_date + 1
  where created_at < safe_cutoff;

  update public.w2_paychecks
  set
    pay_date = pay_date + 1,
    tax_year = extract(year from pay_date + 1)::int,
    tax_quarter = extract(quarter from pay_date + 1)::int
  where created_at < safe_cutoff;

  update public.tax_planning_profiles
  set tax_season_reviewed_at = tax_season_reviewed_at + 1
  where created_at < safe_cutoff
    and tax_season_reviewed_at is not null;

  update public.home_office_space_periods
  set
    effective_from = effective_from + 1,
    effective_to = case
      when effective_to is null then null
      else effective_to + 1
    end
  where created_at < safe_cutoff;
end
$$;
