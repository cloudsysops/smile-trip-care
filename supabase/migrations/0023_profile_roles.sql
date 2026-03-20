-- 0023: Profile roles (multi-role foundation)
-- Additive migration to support multi-role assignments per profile.

create table if not exists public.profile_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_roles_profile_id
  on public.profile_roles(profile_id);

create unique index if not exists uq_profile_roles_profile_role_active
  on public.profile_roles(profile_id, role)
  where is_active = true;

-- Optional: active_role on profiles (not yet wired)
alter table public.profiles
  add column if not exists active_role text;

