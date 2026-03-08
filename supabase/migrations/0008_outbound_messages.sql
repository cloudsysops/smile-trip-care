-- M16: Assisted outbound conversion engine.
-- Run after 0007_ai_automation_jobs.sql.

create table if not exists public.outbound_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  source text not null default 'manual',
  channel text not null,
  status text not null default 'draft',
  subject text,
  body_text text not null,
  provider text,
  provider_message_id text,
  attempts int not null default 0,
  max_attempts int not null default 3,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  replied_at timestamptz,
  failure_reason text,
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'outbound_messages_source_check'
  ) then
    alter table public.outbound_messages
      add constraint outbound_messages_source_check
      check (source in ('ai_draft', 'manual'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'outbound_messages_channel_check'
  ) then
    alter table public.outbound_messages
      add constraint outbound_messages_channel_check
      check (channel in ('whatsapp', 'email'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'outbound_messages_status_check'
  ) then
    alter table public.outbound_messages
      add constraint outbound_messages_status_check
      check (status in ('draft', 'approved', 'queued', 'sent', 'delivered', 'failed', 'replied', 'cancelled'));
  end if;
end $$;

create index if not exists idx_outbound_messages_lead_id
  on public.outbound_messages(lead_id);

create index if not exists idx_outbound_messages_status_scheduled
  on public.outbound_messages(status, scheduled_for);

create index if not exists idx_outbound_messages_created_at
  on public.outbound_messages(created_at desc);

alter table public.outbound_messages enable row level security;

create policy "outbound_messages_admin_all"
  on public.outbound_messages
  for all
  using (public.is_admin());
