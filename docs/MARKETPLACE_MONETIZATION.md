# Marketplace Monetization (Design)

This document describes the schema and design for marketplace monetization. Implementation of billing and payouts is left for a later phase.

**Context:** Nebula Smile is a **curated private network**, not an open marketplace. Providers and specialists are admin-created and -approved only; there is no public signup. See [CURATED_NETWORK_FOUNDATION.md](CURATED_NETWORK_FOUNDATION.md) and [DATA_MODEL.md](DATA_MODEL.md).

## Supported mechanisms

1. **Commission per booking**  
   When a booking is completed (e.g. lead status `deposit_paid` or `completed`), the platform can calculate a commission. Recommended: add a `bookings` (or extend `payments`) table with `commission_cents`, `commission_rate`, or derive from a configurable rate per package/provider. Stripe Connect or manual payouts can be used for remitting to providers.

2. **Featured packages**  
   The `packages` table has a `featured` boolean. Featured packages can be shown first or in a dedicated section on `/packages` and `/health-packages`. Listing fees or subscription tiers can gate this flag (admin or future provider dashboard).

3. **Provider listings**  
   The `providers` table has `featured_listing`. Featured providers can be highlighted in marketplace UI and search. Monetization: paid placement or subscription for providers.

## Schema (already in place)

- `packages.featured` — boolean, default false  
- `providers.featured_listing` — boolean, default false  

Commission and payouts require either:

- New columns on `payments` (e.g. `commission_cents`, `provider_id`), or  
- A dedicated `bookings` table linking leads/payments to packages and providers with commission and status.

## Next steps

- Define commission rules (percentage vs fixed, per package type).  
- Add provider payouts (Stripe Connect or manual).  
- Optional: provider dashboard to manage listings and see earnings.
