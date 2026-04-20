-- Testimonials should be reviewed in the admin workspace before appearing publicly on the Academy
-- site, so existing rows gain a moderation state and new rows default to pending.

alter table public.academy_testimonials
add column if not exists moderation_status text not null default 'pending';

alter table public.academy_testimonials
drop constraint if exists academy_testimonials_moderation_status_check;

alter table public.academy_testimonials
add constraint academy_testimonials_moderation_status_check
check (moderation_status in ('pending', 'approved', 'rejected'));

update public.academy_testimonials
set moderation_status = case
  when is_published then 'approved'
  else 'pending'
end
where moderation_status is distinct from case
  when is_published then 'approved'
  else 'pending'
end;

alter table public.academy_testimonials
alter column moderation_status set default 'pending';

