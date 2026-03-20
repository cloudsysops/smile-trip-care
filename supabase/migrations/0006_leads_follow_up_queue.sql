-- M11: Sales follow-up queue fields for lead operations.
-- Run after 0004_leads_attribution.sql.

alter table public.leads add column if not exists last_contacted_at timestamptz;
alter table public.leads add column if not exists next_follow_up_at timestamptz;
alter table public.leads add column if not exists follow_up_notes text;

create index if not exists idx_leads_next_follow_up_at
  on public.leads(next_follow_up_at)
  where next_follow_up_at is not null;
