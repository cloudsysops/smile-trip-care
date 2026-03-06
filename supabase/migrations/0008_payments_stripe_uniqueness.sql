-- M15: Stripe idempotency hardening with DB-level uniqueness.
-- Run after 0007_ai_automation_jobs.sql.

with ranked_sessions as (
  select
    id,
    row_number() over (
      partition by stripe_checkout_session_id
      order by created_at desc, id desc
    ) as rn
  from public.payments
  where stripe_checkout_session_id is not null
)
delete from public.payments p
using ranked_sessions rs
where p.id = rs.id
  and rs.rn > 1;

with ranked_intents as (
  select
    id,
    row_number() over (
      partition by stripe_payment_intent_id
      order by created_at desc, id desc
    ) as rn
  from public.payments
  where stripe_payment_intent_id is not null
)
delete from public.payments p
using ranked_intents ri
where p.id = ri.id
  and ri.rn > 1;

create unique index if not exists uq_payments_stripe_checkout_session
  on public.payments(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists uq_payments_stripe_payment_intent
  on public.payments(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
