-- M13: AI automation foundation fields (status tracking + automation outputs).
-- Run after 0005_leads_follow_up_queue.sql.

alter table public.lead_ai add column if not exists ops_json jsonb;
alter table public.lead_ai add column if not exists followup_24h_json jsonb;
alter table public.lead_ai add column if not exists followup_48h_json jsonb;

alter table public.lead_ai add column if not exists triage_completed boolean not null default false;
alter table public.lead_ai add column if not exists response_generated boolean not null default false;
alter table public.lead_ai add column if not exists itinerary_generated boolean not null default false;
alter table public.lead_ai add column if not exists ops_generated boolean not null default false;
