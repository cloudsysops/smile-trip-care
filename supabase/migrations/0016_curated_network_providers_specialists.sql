-- Curated Private Network: providers and specialists are invite-only, admin-approved.
-- Run after 0008. No public signup; only admins create/approve providers and specialists.

-- ========== PROVIDERS ==========
alter table public.providers add column if not exists invited_by_provider_id uuid references public.providers(id) on delete set null;
alter table public.providers add column if not exists approved_by uuid references public.profiles(id) on delete set null;
alter table public.providers add column if not exists approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected'));
alter table public.providers add column if not exists is_family_network boolean not null default false;
alter table public.providers add column if not exists internal_notes text;

create index if not exists idx_providers_invited_by on public.providers(invited_by_provider_id);
create index if not exists idx_providers_approval_status on public.providers(approval_status);
create index if not exists idx_providers_approved_by on public.providers(approved_by);

comment on column public.providers.invited_by_provider_id is 'Provider who recommended/invited this one (curated network)';
comment on column public.providers.approved_by is 'Admin (profile id) who approved this provider';
comment on column public.providers.approval_status is 'pending | approved | rejected; only approved appear in curated catalog';
comment on column public.providers.is_family_network is 'Part of the core family-oriented trusted network';
comment on column public.providers.internal_notes is 'Admin-only notes; never shown publicly';

comment on table public.providers is 'Curated private network: clinics, tour operators; invite-only, admin-approved. No public signup.';

-- ========== SPECIALISTS ==========
alter table public.specialists add column if not exists recommended_by_provider_id uuid references public.providers(id) on delete set null;
alter table public.specialists add column if not exists approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected'));

create index if not exists idx_specialists_recommended_by on public.specialists(recommended_by_provider_id);
create index if not exists idx_specialists_approval_status on public.specialists(approval_status);

comment on column public.specialists.recommended_by_provider_id is 'Provider (e.g. clinic) who recommended this specialist';
comment on column public.specialists.approval_status is 'pending | approved | rejected; only approved can be published';

-- Grandfather existing: treat current providers and published specialists as approved so public catalog is unchanged.
update public.providers set approval_status = 'approved' where approval_status = 'pending';
update public.specialists set approval_status = 'approved' where approval_status = 'pending' and published = true;

-- RLS: unchanged — providers and specialists already have admin_all; public has select.
-- Application layer must filter: public-facing content only uses approval_status = 'approved' (and published for specialists/packages/experiences).
