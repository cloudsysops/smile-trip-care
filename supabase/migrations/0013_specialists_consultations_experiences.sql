-- Specialists, consultations, experiences + packages two-city + leads interests
-- Run after 0005. Supports medical tourism journey: Medellín → Manizales.

-- packages: two-city journey (location = treatment city, recovery_city = recovery)
alter table public.packages add column if not exists recovery_city text;
alter table public.packages add column if not exists badge text;

comment on column public.packages.recovery_city is 'Recovery city (e.g. Manizales) for two-city journey';
comment on column public.packages.badge is 'e.g. MOST POPULAR, ALL INCLUSIVE';

-- specialists (published catalog)
create table if not exists public.specialists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null,
  city text not null,
  clinic text,
  description text,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_specialists_published on public.specialists(published) where published = true;
create index if not exists idx_specialists_city on public.specialists(city);
create index if not exists idx_specialists_sort on public.specialists(sort_order, name);

-- experiences (recovery/tourism options)
create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  category text not null default 'other',
  description text,
  price_cents bigint,
  duration_hours decimal(5,2),
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_experiences_published on public.experiences(published) where published = true;
create index if not exists idx_experiences_city on public.experiences(city);
create index if not exists idx_experiences_sort on public.experiences(sort_order, name);

-- leads: store specialist and experience interests (IDs)
alter table public.leads add column if not exists specialist_ids uuid[] not null default '{}';
alter table public.leads add column if not exists experience_ids uuid[] not null default '{}';

comment on column public.leads.specialist_ids is 'IDs of specialists patient wants to consult';
comment on column public.leads.experience_ids is 'IDs of experiences patient is interested in';

-- consultations (admin-created when scheduling specialist for a lead)
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  specialist_id uuid not null references public.specialists(id) on delete restrict,
  status text not null default 'requested' check (status in ('requested', 'scheduled', 'completed', 'cancelled')),
  scheduled_date date,
  scheduled_time time,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(lead_id, specialist_id)
);

create index if not exists idx_consultations_lead_id on public.consultations(lead_id);
create index if not exists idx_consultations_specialist_id on public.consultations(specialist_id);
create index if not exists idx_consultations_status on public.consultations(status);

-- RLS
alter table public.specialists enable row level security;
alter table public.experiences enable row level security;
alter table public.consultations enable row level security;

-- specialists: public SELECT when published; admin all
drop policy if exists "specialists_public_select" on public.specialists;
create policy "specialists_public_select" on public.specialists for select using (published = true);
drop policy if exists "specialists_admin_all" on public.specialists;
create policy "specialists_admin_all" on public.specialists for all using (public.is_admin());

-- experiences: public SELECT when published; admin all
drop policy if exists "experiences_public_select" on public.experiences;
create policy "experiences_public_select" on public.experiences for select using (published = true);
drop policy if exists "experiences_admin_all" on public.experiences;
create policy "experiences_admin_all" on public.experiences for all using (public.is_admin());

-- consultations: admin only
drop policy if exists "consultations_admin_all" on public.consultations;
create policy "consultations_admin_all" on public.consultations for all using (public.is_admin());
