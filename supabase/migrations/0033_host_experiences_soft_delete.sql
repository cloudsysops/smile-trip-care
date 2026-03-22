-- Host dashboard: soft-delete flag for experiences (separate from marketplace `published`).

alter table public.experiences
  add column if not exists is_active boolean not null default true;

comment on column public.experiences.is_active is 'When false, experience is archived (soft-deleted) and hidden from host lists.';

create index if not exists idx_experiences_host_active on public.experiences(host_id) where is_active = true;
