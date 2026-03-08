-- Curated Medical Tourism Network — Enterprise foundation (ADDITIVE ONLY).
-- Run after 0009. Preserves all existing columns and flows; adds enterprise fields and junction tables.

-- ========== 1. PROVIDERS (extend existing) ==========
alter table public.providers add column if not exists slug text unique;
alter table public.providers add column if not exists provider_type text check (provider_type in ('clinic','specialist','tour_operator','hotel','transport','wellness'));
alter table public.providers add column if not exists country text not null default 'Colombia';
alter table public.providers add column if not exists contact_email text;
alter table public.providers add column if not exists contact_phone text;
alter table public.providers add column if not exists website text;
alter table public.providers add column if not exists published boolean not null default false;

create index if not exists idx_providers_slug on public.providers(slug) where slug is not null;
create index if not exists idx_providers_published on public.providers(published) where published = true;
create index if not exists idx_providers_provider_type on public.providers(provider_type) where provider_type is not null;

-- Extend approval_status to include 'suspended' (drop + re-add check)
alter table public.providers drop constraint if exists providers_approval_status_check;
alter table public.providers add constraint providers_approval_status_check check (approval_status in ('pending','approved','rejected','suspended'));

comment on column public.providers.slug is 'URL-friendly identifier; unique';
comment on column public.providers.provider_type is 'Enterprise: clinic, specialist, tour_operator, hotel, transport, wellness';
comment on column public.providers.published is 'Only published providers appear in public catalog (with approved)';

-- ========== 2. PACKAGES (extend existing) ==========
alter table public.packages add column if not exists package_type text check (package_type in ('health','tour','combo'));
alter table public.packages add column if not exists title text;
alter table public.packages add column if not exists subtitle text;
alter table public.packages add column if not exists origin_city text;
alter table public.packages add column if not exists destination_city text;
alter table public.packages add column if not exists price_from_usd numeric(12,2);
alter table public.packages add column if not exists highlights jsonb default '[]';
alter table public.packages add column if not exists includes jsonb default '[]';
alter table public.packages add column if not exists excludes jsonb default '[]';
alter table public.packages add column if not exists updated_at timestamptz default now();

create index if not exists idx_packages_package_type on public.packages(package_type) where package_type is not null;
create index if not exists idx_packages_origin_city on public.packages(origin_city) where origin_city is not null;

comment on column public.packages.package_type is 'Enterprise alias for type: health, tour, combo';
comment on column public.packages.highlights is 'JSON array of highlight strings';
comment on column public.packages.includes is 'JSON array of included items';
comment on column public.packages.excludes is 'JSON array of excluded items';

-- ========== 3. SPECIALISTS (extend existing) ==========
alter table public.specialists add column if not exists slug text unique;
alter table public.specialists add column if not exists clinic_name text;
alter table public.specialists add column if not exists bio text;
alter table public.specialists add column if not exists photo_asset_id uuid;
alter table public.specialists add column if not exists free_evaluation boolean not null default true;

create index if not exists idx_specialists_slug on public.specialists(slug) where slug is not null;

alter table public.specialists drop constraint if exists specialists_approval_status_check;
alter table public.specialists add constraint specialists_approval_status_check check (approval_status in ('pending','approved','rejected','suspended'));

comment on column public.specialists.bio is 'Long-form bio (description remains short)';
comment on column public.specialists.clinic_name is 'Display name of clinic (clinic remains for legacy)';

-- ========== 4. EXPERIENCES (extend existing) ==========
alter table public.experiences add column if not exists slug text unique;
alter table public.experiences add column if not exists price_usd numeric(12,2);
alter table public.experiences add column if not exists includes jsonb default '[]';
-- Optional: constrain category to enterprise set (existing 'other' allowed); add only if no constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    where t.relname = 'experiences' and c.conname like '%category%'
  ) then
    alter table public.experiences add constraint experiences_category_enterprise_check
      check (category in ('nature','culture','adventure','wellness','food','recovery','other'));
  end if;
end $$;

create index if not exists idx_experiences_slug on public.experiences(slug) where slug is not null;
create index if not exists idx_experiences_category on public.experiences(category);

comment on column public.experiences.includes is 'JSON array of included items';

-- ========== 5. PACKAGE_EXPERIENCES (new junction) ==========
create table if not exists public.package_experiences (
  package_id uuid not null references public.packages(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete cascade,
  is_included boolean not null default false,
  sort_order int not null default 0,
  primary key (package_id, experience_id)
);
create index if not exists idx_package_experiences_package on public.package_experiences(package_id);
create index if not exists idx_package_experiences_experience on public.package_experiences(experience_id);

alter table public.package_experiences enable row level security;
drop policy if exists "package_experiences_public_select" on public.package_experiences;
create policy "package_experiences_public_select" on public.package_experiences for select using (true);
drop policy if exists "package_experiences_admin_all" on public.package_experiences;
create policy "package_experiences_admin_all" on public.package_experiences for all using (public.is_admin());

-- ========== 6. PACKAGE_SPECIALISTS (new junction) ==========
create table if not exists public.package_specialists (
  package_id uuid not null references public.packages(id) on delete cascade,
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (package_id, specialist_id)
);
create index if not exists idx_package_specialists_package on public.package_specialists(package_id);
create index if not exists idx_package_specialists_specialist on public.package_specialists(specialist_id);

alter table public.package_specialists enable row level security;
drop policy if exists "package_specialists_public_select" on public.package_specialists;
create policy "package_specialists_public_select" on public.package_specialists for select using (true);
drop policy if exists "package_specialists_admin_all" on public.package_specialists;
create policy "package_specialists_admin_all" on public.package_specialists for all using (public.is_admin());

-- ========== 7. LEADS (extend existing) ==========
alter table public.leads add column if not exists selected_specialties jsonb default '[]';
alter table public.leads add column if not exists selected_experience_categories jsonb default '[]';
alter table public.leads add column if not exists selected_experience_ids jsonb default '[]';
alter table public.leads add column if not exists travel_companions text;
alter table public.leads add column if not exists budget_range text;
alter table public.leads add column if not exists utm_source text;
alter table public.leads add column if not exists utm_medium text;
alter table public.leads add column if not exists utm_campaign text;
alter table public.leads add column if not exists updated_at timestamptz default now();

create index if not exists idx_leads_updated_at on public.leads(updated_at desc);

-- ========== 8. CONSULTATIONS (extend existing) ==========
alter table public.consultations add column if not exists scheduled_at timestamptz;

comment on column public.consultations.scheduled_at is 'Combined date/time for scheduling';

-- ========== 9. BOOKINGS (extend existing) ==========
alter table public.bookings add column if not exists total_price_usd numeric(12,2);
alter table public.bookings add column if not exists deposit_paid boolean not null default false;
alter table public.bookings add column if not exists start_date date;
alter table public.bookings add column if not exists end_date date;
alter table public.bookings add column if not exists notes text;

-- Extend status to include draft, confirmed, in_progress (keep existing values for compat)
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check check (status in (
  'pending','deposit_paid','completed','cancelled','draft','confirmed','in_progress'
));

create index if not exists idx_bookings_start_date on public.bookings(start_date) where start_date is not null;

comment on column public.bookings.deposit_paid is 'Whether deposit has been paid';
comment on column public.bookings.total_price_usd is 'Total package price in USD';

-- ========== RLS: Public read only for published + approved ==========
-- Providers: public sees only published and approved (curated network)
drop policy if exists "providers_public_select" on public.providers;
create policy "providers_public_select" on public.providers for select using (
  published = true and approval_status = 'approved'
);

-- Specialists: public sees only published and approved
drop policy if exists "specialists_public_select" on public.specialists;
create policy "specialists_public_select" on public.specialists for select using (
  published = true and approval_status = 'approved'
);

-- Packages: ensure RLS and public read only for published
alter table public.packages enable row level security;
drop policy if exists "packages_public_select" on public.packages;
create policy "packages_public_select" on public.packages for select using (published = true);
drop policy if exists "packages_admin_all" on public.packages;
create policy "packages_admin_all" on public.packages for all using (public.is_admin());
