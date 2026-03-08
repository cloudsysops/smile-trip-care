-- Idempotencia de pagos: evitar duplicados por sesión de Stripe (reintentos del webhook).
-- Ejecutar en Supabase SQL Editor después de 0004_leads_attribution.
-- Si falla por "duplicate key", elimina o corrige filas duplicadas en payments.stripe_checkout_session_id antes de volver a ejecutar.

-- Una sola fila por stripe_checkout_session_id (varios NULL permitidos).
alter table public.payments
add constraint payments_stripe_session_unique
unique (stripe_checkout_session_id);

-- Opcional: una sola fila por stripe_payment_intent_id cuando exista.
create unique index if not exists payments_payment_intent_unique
on public.payments(stripe_payment_intent_id)
where stripe_payment_intent_id is not null;
