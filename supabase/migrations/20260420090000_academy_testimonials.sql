-- Public testimonials let Academy families share either written feedback, a short video review,
-- or both, and the standalone Academy site reads the entries directly for the testimonials page.

create table if not exists public.academy_testimonials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  first_name text not null,
  last_name text not null,
  class_year text not null,
  tutor_name text not null,
  subject text not null,
  impression text,
  video_path text,
  video_url text,
  moderation_status text not null default 'approved',
  is_published boolean not null default true,
  constraint academy_testimonials_content_check check (
    (impression is not null and char_length(trim(impression)) > 0) or video_url is not null
  ),
  constraint academy_testimonials_moderation_status_check check (
    moderation_status in ('pending', 'approved', 'rejected')
  )
);

create index if not exists academy_testimonials_created_at_idx
on public.academy_testimonials (created_at desc);

drop trigger if exists academy_testimonials_updated_at on public.academy_testimonials;
create trigger academy_testimonials_updated_at
before update on public.academy_testimonials
for each row
execute function public.set_updated_at();

alter table public.academy_testimonials enable row level security;

drop policy if exists "Academy testimonials are publicly readable" on public.academy_testimonials;
create policy "Academy testimonials are publicly readable"
on public.academy_testimonials
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Academy testimonials can be submitted publicly" on public.academy_testimonials;
create policy "Academy testimonials can be submitted publicly"
on public.academy_testimonials
for insert
to anon, authenticated
with check (
  char_length(trim(first_name)) > 0
  and char_length(trim(last_name)) > 0
  and char_length(trim(class_year)) > 0
  and char_length(trim(tutor_name)) > 0
  and char_length(trim(subject)) > 0
  and (
    (impression is not null and char_length(trim(impression)) > 0)
    or video_url is not null
  )
);

insert into storage.buckets (id, name, public)
values ('academy-testimonials', 'academy-testimonials', true)
on conflict (id) do nothing;

drop policy if exists "Public can read Academy testimonial videos" on storage.objects;
create policy "Public can read Academy testimonial videos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'academy-testimonials');
