-- Project intake submissions from the /start wizard. Writes happen exclusively via the
-- server-side API route (service role key), so no public-insert RLS policy is needed.
-- Admin reads also use the service role. RLS is enabled with no policies to deny all
-- direct anon/authenticated access.

create table if not exists public.project_intake_submissions (
  id                  uuid        primary key default gen_random_uuid(),
  created_at          timestamptz not null    default timezone('utc', now()),
  updated_at          timestamptz not null    default timezone('utc', now()),

  -- Contact
  full_name           text        not null,
  email               text        not null,
  phone               text,
  company             text,
  website             text,
  referral_source     text,

  -- Project shape (jsonb for multi-select arrays)
  project_types       jsonb       not null    default '[]',
  project_summary     text        not null,
  project_details     text,

  -- Scope
  features            jsonb       not null    default '[]',
  design_status       text,
  existing_systems    text,

  -- Budget & timeline
  budget_range        text        not null,
  timeline            text        not null,
  engagement_type     text,
  business_stage      text,

  -- Context
  target_audience     text,
  success_definition  text,
  replacing_existing  text,
  compliance_needs    text,
  maintenance_owner   text,
  stakeholders        text,
  additional_notes    text,

  -- Meta
  source_page         text,
  status              text        not null    default 'new'
                        check (status in ('new', 'reviewing', 'quoted', 'won', 'lost'))
);

create index if not exists project_intake_submissions_status_created_at_idx
  on public.project_intake_submissions (status, created_at desc);

drop trigger if exists project_intake_submissions_updated_at on public.project_intake_submissions;
create trigger project_intake_submissions_updated_at
  before update on public.project_intake_submissions
  for each row execute function public.set_updated_at();

alter table public.project_intake_submissions enable row level security;
-- No policies — all access is via service role key (server API + admin pages).
