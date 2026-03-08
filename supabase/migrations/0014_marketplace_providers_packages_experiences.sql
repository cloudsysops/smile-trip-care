-- Marketplace: providers, package types, experiences linked to providers
-- Run after 0006. Supports medical tourism marketplace (Medellín, Manizales).

-- providers (clinics, tour operators, specialists)
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('clinic', 'tour_operator', 'specialist')),
  city text not null,
  description text,
  verified boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_providers_type on public.providers(type);
create index if not exists idx_providers_city on public.providers(city);
create index if not exists idx_providers_verified on public.providers(verified) where verified = true;

comment on table public.providers is 'Marketplace providers: clinics, tour operators, specialists';

-- packages: link to provider and add type (health | tour | combo), price
alter table public.packages add column if not exists provider_id uuid references public.providers(id) on delete set null;
alter table public.packages add column if not exists type text not null default 'health' check (type in ('health', 'tour', 'combo'));
alter table public.packages add column if not exists price_cents bigint;

create index if not exists idx_packages_provider_id on public.packages(provider_id);
create index if not exists idx_packages_type on public.packages(type);
comment on column public.packages.type is 'Package type: health, tour, or combo';

-- experiences: link to provider
alter table public.experiences add column if not exists provider_id uuid references public.providers(id) on delete set null;
create index if not exists idx_experiences_provider_id on public.experiences(provider_id);

-- Monetization: featured packages and provider listings (design support)
alter table public.packages add column if not exists featured boolean not null default false;
alter table public.providers add column if not exists featured_listing boolean not null default false;
comment on column public.packages.featured is 'Featured packages for marketplace prominence';
comment on column public.providers.featured_listing is 'Provider paid/featured listing';

-- RLS for providers
alter table public.providers enable row level security;
drop policy if exists "providers_public_select" on public.providers;
create policy "providers_public_select" on public.providers for select using (true);
drop policy if exists "providers_admin_all" on public.providers;
create policy "providers_admin_all" on public.providers for all using (public.is_admin());
