-- AUTH + ROLE DASHBOARDS: extend profiles for role-based access (ADDITIVE ONLY).
-- Run after 0010. Supports: admin, coordinator, provider_manager, specialist, patient.
-- Providers/specialists do NOT sign up publicly; admins create/invite and set role + provider_id/specialist_id.

-- ========== 1. PROFILES: new columns ==========
alter table public.profiles add column if not exists provider_id uuid references public.providers(id) on delete set null;
alter table public.profiles add column if not exists specialist_id uuid references public.specialists(id) on delete set null;
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists created_at timestamptz default now();

create index if not exists idx_profiles_provider_id on public.profiles(provider_id) where provider_id is not null;
create index if not exists idx_profiles_specialist_id on public.profiles(specialist_id) where specialist_id is not null;
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_is_active on public.profiles(is_active) where is_active = true;

comment on column public.profiles.provider_id is 'Set when role is provider_manager; scopes dashboard to this provider.';
comment on column public.profiles.specialist_id is 'Set when role is specialist; scopes dashboard to this specialist.';
comment on column public.profiles.is_active is 'If false, user cannot log in (curated network).';
comment on column public.profiles.created_at is 'When the profile was created (invite/onboarding).';

-- ========== 2. ROLE CHECK: extend allowed values ==========
-- Current: role in ('user', 'admin'). Add: coordinator, provider_manager, specialist, patient.
-- Keep 'user' for backward compatibility (treat as patient in app).
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (
  role in ('admin', 'coordinator', 'provider_manager', 'specialist', 'patient', 'user')
);

-- Backfill created_at for existing rows
update public.profiles set created_at = coalesce(updated_at, now()) where created_at is null;

-- ========== 3. RLS HELPERS (for future use: role-based policies) ==========
-- is_admin() already exists. Add helpers for other roles (optional; app layer can use profile.role).
create or replace function public.current_profile_role()
returns text as $$
  select role from public.profiles where id = auth.uid() and is_active = true limit 1;
$$ language sql security definer stable;

create or replace function public.current_provider_id()
returns uuid as $$
  select provider_id from public.profiles where id = auth.uid() and is_active = true limit 1;
$$ language sql security definer stable;

create or replace function public.current_specialist_id()
returns uuid as $$
  select specialist_id from public.profiles where id = auth.uid() and is_active = true limit 1;
$$ language sql security definer stable;
