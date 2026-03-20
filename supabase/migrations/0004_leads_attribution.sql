-- M10: Lead conversion attribution metadata (UTM + landing/referrer context).
-- Run after 0001_init.sql, 0002_assets_extended_unified.sql, and 0003_m9_ai_admin_connected.sql.

alter table public.leads add column if not exists utm_source text;
alter table public.leads add column if not exists utm_medium text;
alter table public.leads add column if not exists utm_campaign text;
alter table public.leads add column if not exists utm_term text;
alter table public.leads add column if not exists utm_content text;
alter table public.leads add column if not exists landing_path text;
alter table public.leads add column if not exists referrer_url text;

create index if not exists idx_leads_utm_source on public.leads(utm_source) where utm_source is not null;
create index if not exists idx_leads_utm_campaign on public.leads(utm_campaign) where utm_campaign is not null;
