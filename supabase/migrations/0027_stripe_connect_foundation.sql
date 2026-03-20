-- 0027_stripe_connect_foundation.sql
-- Stripe Connect foundation for hosts and specialists.
-- Adds connect account metadata used for onboarding and payout readiness.

-- Hosts: Stripe Connect fields
alter table public.hosts
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarding_complete boolean not null default false,
  add column if not exists stripe_details_submitted boolean not null default false;

-- Specialists: Stripe Connect fields
alter table public.specialists
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarding_complete boolean not null default false,
  add column if not exists stripe_details_submitted boolean not null default false;

