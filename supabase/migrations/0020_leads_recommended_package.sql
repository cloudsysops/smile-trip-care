-- Lead package recommendation (orientation only). Additive.
-- Run after 0019. Enables storing recommended package on lead for thank-you and patient dashboard.

alter table public.leads add column if not exists recommended_package_slug text;
alter table public.leads add column if not exists recommended_package_id uuid references public.packages(id) on delete set null;

create index if not exists idx_leads_recommended_package_id on public.leads(recommended_package_id) where recommended_package_id is not null;

comment on column public.leads.recommended_package_slug is 'Package slug recommended for this lead (orientation only; admin can override).';
comment on column public.leads.recommended_package_id is 'Resolved package id for recommended_package_slug.';
