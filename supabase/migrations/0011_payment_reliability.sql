-- M19: Payment reliability hardening (Stripe webhook dedupe + reconciliation support).
-- Run after 0008_outbound_messages.sql.

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null,
  event_type text not null,
  stripe_api_version text,
  livemode boolean not null default false,
  status text not null default 'received',
  payment_id uuid references public.payments(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  payload_json jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stripe_webhook_events_status_check'
  ) then
    alter table public.stripe_webhook_events
      add constraint stripe_webhook_events_status_check
      check (status in ('received', 'processed', 'ignored', 'failed'));
  end if;
end $$;

create unique index if not exists uq_stripe_webhook_events_event_id
  on public.stripe_webhook_events(stripe_event_id);

create index if not exists idx_stripe_webhook_events_received_at
  on public.stripe_webhook_events(received_at desc);

create index if not exists idx_stripe_webhook_events_event_type
  on public.stripe_webhook_events(event_type);

-- Keep one canonical payment row per checkout session.
-- If legacy duplicates exist, preserve newest row and detach old duplicates from session id.
with ranked as (
  select
    id,
    row_number() over (
      partition by stripe_checkout_session_id
      order by created_at desc, id desc
    ) as rn
  from public.payments
  where stripe_checkout_session_id is not null
)
update public.payments p
set
  stripe_checkout_session_id = null,
  updated_at = now()
from ranked r
where p.id = r.id
  and r.rn > 1;

create unique index if not exists uq_payments_stripe_checkout_session
  on public.payments(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

alter table public.stripe_webhook_events enable row level security;

create policy "stripe_webhook_events_admin_all"
  on public.stripe_webhook_events
  for all
  using (public.is_admin());
