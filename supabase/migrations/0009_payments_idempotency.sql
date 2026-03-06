-- M19: Payment idempotency guardrails for Stripe identifiers.
-- Run after 0008_outbound_messages.sql.

with ranked_checkout as (
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
using ranked_checkout r
where p.id = r.id
  and r.rn > 1;

with ranked_intent as (
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
using ranked_intent r
where p.id = r.id
  and r.rn > 1;

create unique index if not exists uq_payments_stripe_checkout_session_id
  on public.payments(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists uq_payments_stripe_payment_intent_id
  on public.payments(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
