-- Marketplace Foundation: specialists → providers, leads → package_id, bookings table
-- Run after 0007. One booking per lead when lead chooses a package.

-- specialists: link to provider (clinic / tour operator)
alter table public.specialists add column if not exists provider_id uuid references public.providers(id) on delete set null;
create index if not exists idx_specialists_provider_id on public.specialists(provider_id);
comment on column public.specialists.provider_id is 'Provider (clinic/tour operator) this specialist belongs to';

-- leads: FK to package for referential integrity and reporting
alter table public.leads add column if not exists package_id uuid references public.packages(id) on delete set null;
create index if not exists idx_leads_package_id on public.leads(package_id);
comment on column public.leads.package_id is 'Resolved from package_slug at lead creation';

-- bookings: one row per "lead committed to a package" (created when lead has package)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete restrict,
  provider_id uuid references public.providers(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'deposit_paid', 'completed', 'cancelled')),
  deposit_cents bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(lead_id)
);

create index if not exists idx_bookings_lead_id on public.bookings(lead_id);
create index if not exists idx_bookings_package_id on public.bookings(package_id);
create index if not exists idx_bookings_provider_id on public.bookings(provider_id);
create index if not exists idx_bookings_status on public.bookings(status);
comment on table public.bookings is 'One booking per lead; created when lead submits with a package; status updated on payment';

-- RLS: admin only for bookings
alter table public.bookings enable row level security;
drop policy if exists "bookings_admin_all" on public.bookings;
create policy "bookings_admin_all" on public.bookings for all using (public.is_admin());
