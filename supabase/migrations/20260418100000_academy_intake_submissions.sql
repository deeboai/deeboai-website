-- Deebo Academy intake records are modeled separately from the finance admin tables so the public
-- tutoring funnel can grow into its own operational workflow without polluting the finance schema.

create table if not exists public.academy_intake_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  parent_full_name text not null,
  parent_email text not null,
  parent_phone text,
  student_first_name text not null,
  grade text not null,
  subject text not null,
  goals text not null,
  session_format text not null check (session_format in ('online', 'in-person')),
  status text not null default 'new' check (status in ('new', 'contacted', 'converted')),
  accepted_client_agreement boolean not null default false,
  accepted_terms boolean not null default false,
  accepted_privacy boolean not null default false
);

create index if not exists academy_intake_submissions_status_created_at_idx
on public.academy_intake_submissions (status, created_at desc);

drop trigger if exists academy_intake_submissions_updated_at on public.academy_intake_submissions;
create trigger academy_intake_submissions_updated_at
before update on public.academy_intake_submissions
for each row
execute function public.set_updated_at();

alter table public.academy_intake_submissions enable row level security;

drop policy if exists "Academy intake submissions can be created publicly" on public.academy_intake_submissions;
create policy "Academy intake submissions can be created publicly"
on public.academy_intake_submissions
for insert
to anon, authenticated
with check (
  accepted_client_agreement
  and accepted_terms
  and accepted_privacy
  and char_length(trim(parent_full_name)) > 1
  and char_length(trim(parent_email)) > 3
  and char_length(trim(student_first_name)) > 0
  and char_length(trim(grade)) > 0
  and char_length(trim(subject)) > 0
  and char_length(trim(goals)) > 0
  and session_format in ('online', 'in-person')
);
