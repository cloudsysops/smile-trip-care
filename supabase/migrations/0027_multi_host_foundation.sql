-- 0026_multi_host_foundation.sql
-- Multi-host marketplace foundation: hosts table + experience ownership.

-- 1) Extend profiles.role check constraint to include 'host' if constraint exists.
do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'profiles'
      and constraint_type = 'CHECK'
      and constraint_name = 'profiles_role_check'
  ) then
    alter table public.profiles
      drop constraint profiles_role_check;

    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('admin','coordinator','provider_manager','specialist','patient','user','host'));
  end if;
end $$;

-- 2) Hosts table
create table if not exists public.hosts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  city text,
  bio text,
  phone text,
  whatsapp text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_hosts_profile_id on public.hosts(profile_id);

-- 3) Experience ownership: host_id on experiences
alter table public.experiences
  add column if not exists host_id uuid references public.hosts(id) on delete set null;

