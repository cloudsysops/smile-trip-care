-- Nebula Smile MVP: init schema + RLS
-- Run in Supabase SQL editor or via supabase db push

-- profiles (extends auth.users; link via auth.uid())
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  updated_at timestamptz default now()
);

-- packages (public catalog; RLS: SELECT only when published=true)
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  location text not null,
  description text,
  duration_days int,
  deposit_cents bigint,
  included text[],
  itinerary_outline text,
  published boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_packages_slug on public.packages(slug);
create index if not exists idx_packages_published on public.packages(published) where published = true;

-- leads (admin-only read/write)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  country text,
  package_slug text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'deposit_paid', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_created_at on public.leads(created_at desc);

-- payments (admin-only; link to leads)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete restrict,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  amount_cents bigint,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_payments_lead_id on public.payments(lead_id);
create index if not exists idx_payments_stripe_session on public.payments(stripe_checkout_session_id);

-- assets (media; public SELECT only when approved=true and published=true)
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  kind text not null,
  url text,
  title text,
  approved boolean not null default false,
  published boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_assets_slug on public.assets(slug);
create index if not exists idx_assets_approved_published on public.assets(approved, published) where approved = true and published = true;

-- itineraries (admin-only; optional detail per package)
create table if not exists public.itineraries (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  day_index int not null,
  title text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_itineraries_package_id on public.itineraries(package_id);

-- lead_ai (admin-only; AI/notes per lead)
create table if not exists public.lead_ai (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_lead_ai_lead_id on public.lead_ai(lead_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.packages enable row level security;
alter table public.leads enable row level security;
alter table public.payments enable row level security;
alter table public.assets enable row level security;
alter table public.itineraries enable row level security;
alter table public.lead_ai enable row level security;

-- Helper: is current user admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- profiles: user can read/update own; admin can all
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_admin_all" on public.profiles for all using (public.is_admin());

-- packages: public SELECT only when published=true
create policy "packages_public_select" on public.packages for select using (published = true);
create policy "packages_admin_all" on public.packages for all using (public.is_admin());

-- leads: admin only
create policy "leads_admin_all" on public.leads for all using (public.is_admin());

-- payments: admin only
create policy "payments_admin_all" on public.payments for all using (public.is_admin());

-- assets: public SELECT only when approved and published
create policy "assets_public_select" on public.assets for select using (approved = true and published = true);
create policy "assets_admin_all" on public.assets for all using (public.is_admin());

-- itineraries: admin only
create policy "itineraries_admin_all" on public.itineraries for all using (public.is_admin());

-- lead_ai: admin only
create policy "lead_ai_admin_all" on public.lead_ai for all using (public.is_admin());

-- Trigger: create profile on signup (auth.users)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
