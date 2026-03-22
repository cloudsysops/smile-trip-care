-- Services marketplace: catalog (hosts) + patient trip builder (itinerary items).
-- Run after 0031_consultations_specialist_workflow.sql.

-- ========== 1) Services catalog ==========
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.hosts(id) on delete cascade,
  name text not null,
  description text,
  category text not null check (category in (
    'lodging', 'transport', 'experience',
    'therapy', 'accompaniment', 'other'
  )),
  price_cents bigint not null default 0,
  price_per text not null default 'person'
    check (price_per in ('person', 'group', 'day', 'session', 'transfer')),
  city text,
  duration_hours numeric,
  max_capacity integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_services_host_id on public.services(host_id);
create index if not exists idx_services_category_active on public.services(category, is_active)
  where is_active = true;

-- ========== 2) Patient itinerary (trip builder) ==========
create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  item_type text not null check (item_type in (
    'treatment', 'lodging', 'transport',
    'experience', 'therapy', 'custom'
  )),
  title text not null,
  description text,
  scheduled_date date,
  scheduled_time time,
  duration_hours numeric,
  price_cents bigint default 0,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_itinerary_items_lead_id on public.itinerary_items(lead_id);
create index if not exists idx_itinerary_items_service_id on public.itinerary_items(service_id)
  where service_id is not null;

-- ========== 3) RLS ==========
alter table public.services enable row level security;
alter table public.itinerary_items enable row level security;

-- Helper: patient owns lead when lead email matches profile email (same as app patient dashboard).
create or replace function public.patient_owns_lead(lead_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leads l
    join public.profiles p
      on lower(trim(l.email)) = lower(trim(p.email))
    where l.id = lead_uuid
      and p.id = auth.uid()
      and coalesce(p.is_active, true)
  );
$$;

-- services: public read active listings
create policy "services_select_active_public"
  on public.services
  for select
  using (is_active = true);

-- services: host full access to own rows (including inactive)
create policy "services_host_all_own"
  on public.services
  for all
  using (
    host_id is not null
    and exists (
      select 1 from public.hosts h
      where h.id = services.host_id
        and h.profile_id = auth.uid()
    )
  )
  with check (
    host_id is not null
    and exists (
      select 1 from public.hosts h
      where h.id = services.host_id
        and h.profile_id = auth.uid()
    )
  );

-- services: admin
create policy "services_admin_all"
  on public.services
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- itinerary_items: admin
create policy "itinerary_items_admin_all"
  on public.itinerary_items
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- itinerary_items: patient with matching lead email
create policy "itinerary_items_patient_select"
  on public.itinerary_items
  for select
  using (public.patient_owns_lead(lead_id));

create policy "itinerary_items_patient_insert"
  on public.itinerary_items
  for insert
  with check (public.patient_owns_lead(lead_id));

create policy "itinerary_items_patient_update"
  on public.itinerary_items
  for update
  using (public.patient_owns_lead(lead_id))
  with check (public.patient_owns_lead(lead_id));

create policy "itinerary_items_patient_delete"
  on public.itinerary_items
  for delete
  using (public.patient_owns_lead(lead_id));

comment on table public.services is 'Host-offered add-ons for dental trip marketplace.';
comment on table public.itinerary_items is 'Patient trip builder lines linked to a lead.';
