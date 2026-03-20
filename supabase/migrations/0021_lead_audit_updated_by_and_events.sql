-- Lead audit: who updated and event log for lead changes.
-- Apply after 0020_leads_recommended_package.sql.

-- updated_by on leads (admin/coordinator who last updated)
alter table public.leads
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

comment on column public.leads.updated_by is 'Profile id of admin/coordinator who last updated this lead.';

-- lead_events: audit trail for lead changes
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  payload jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_events_lead_id on public.lead_events(lead_id);
create index if not exists idx_lead_events_created_at on public.lead_events(created_at desc);

comment on table public.lead_events is 'Audit log of lead updates: who changed what and when.';

-- RLS: admin only (same as leads)
alter table public.lead_events enable row level security;

create policy "lead_events_admin_all"
  on public.lead_events for all
  using (public.is_admin());
