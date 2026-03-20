## Stripe Connect foundation

### What this adds

- **Schema (Supabase)**
  - `public.hosts`
    - `stripe_account_id text`
    - `stripe_onboarding_complete boolean not null default false`
    - `stripe_details_submitted boolean not null default false`
  - `public.specialists`
    - `stripe_account_id text`
    - `stripe_onboarding_complete boolean not null default false`
    - `stripe_details_submitted boolean not null default false`
- **Service layer**
  - `lib/services/stripe-connect.service.ts`
    - `createOrGetHostStripeAccount(hostId)`
    - `createHostOnboardingLink(hostId, returnUrl, refreshUrl)`
    - `refreshStripeAccountStatusForHost(hostId)`
    - `createOrGetSpecialistStripeAccount(specialistId)`
    - `createSpecialistOnboardingLink(specialistId, returnUrl, refreshUrl)`
    - `refreshStripeAccountStatusForSpecialist(specialistId)`
- **API routes**
  - `POST /api/stripe/connect/host/onboarding`
  - `POST /api/stripe/connect/specialist/onboarding`
- **Dashboards**
  - `/host` — shows host Stripe payout setup status + "Connect Stripe" button.
  - `/specialist` — shows specialist Stripe payout setup status + "Connect Stripe" button.
  - `/admin/payouts` — read-only view of host/specialist Stripe readiness.

### How onboarding works

1. **Host**
   - Host visits `/host`.
   - Clicks **Connect Stripe**.
   - Browser calls `POST /api/stripe/connect/host/onboarding`.
   - Route:
     - Ensures user is authenticated and has a `hosts` row.
     - Calls `createHostOnboardingLink` in `stripe-connect.service`.
     - Service:
       - Reads `hosts.stripe_account_id`.
       - Creates an Express Stripe Connect account when missing and stores `stripe_account_id`.
       - Creates an `account_links` onboarding URL with `return_url` and `refresh_url` pointing back to `/host`.
   - Client redirects the browser to the onboarding URL.
   - After onboarding, Stripe sends the user back to `/host`.
2. **Specialist**
   - Same flow using `/specialist`, `requireSpecialist` guard, and `createSpecialistOnboardingLink`.

### What remains manual

- **Payouts are still manual.**
  - Existing revenue tracking and (if present) payouts tables remain the source of truth.
  - No automatic `transfer` or `payout` calls to Stripe are made in this sprint.
- **Checkout + webhook semantics unchanged.**
  - `/api/stripe/checkout` and `/api/stripe/webhook` were not modified.
  - All existing payment idempotency and status updates continue to work as before.

### Future work (deferred)

- Add `stripe_account_id` based routing to payouts:
  - Use `application_fee_amount` + `transfer_data` in Checkout sessions.
  - Or call Stripe `transfers` after webhook confirmation.
- Expose onboarding status more prominently in host/specialist dashboards:
  - Periodically call `refreshStripeAccountStatusForHost/ForSpecialist`.
- Build admin workflows for:
  - Marking payouts as paid based on Stripe transfers.
  - Viewing reconciliation between internal payouts and Stripe Connect balances.

