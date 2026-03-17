## Funnel Analytics Plan

### 1. Goals

- Understand how private beta testers move through the funnel:
  - Landing → package exploration → assessment → proposal → checkout → payment.
- Measure auth friction:
  - Signup vs login success.
- Capture qualitative feedback:
  - Where users feel blocked, confused, or delighted.

### 2. Core events

Planned event names (mirrored in `lib/analytics.ts`):

- `landing_view`
- `package_view`
- `assessment_started`
- `assessment_submitted`
- `checkout_started`
- `payment_succeeded`
- `login_success`
- `signup_success`
- `feedback_submitted`

### 3. Event definitions

- **landing_view**
  - When: user loads a primary marketing or package landing page.
  - Props: `{ path, referrer, utm_source, utm_medium, utm_campaign }`.

- **package_view**
  - When: user views a specific package detail page.
  - Props: `{ slug, package_id }`.

- **assessment_started**
  - When: user focuses the assessment form or first submits.
  - Props: `{ path, prefill_package_slug }`.

- **assessment_submitted**
  - When: `POST /api/leads` succeeds.
  - Props: `{ lead_id, package_slug, recommended_package_slug }`.

- **checkout_started**
  - When: patient clicks “Pay deposit” and `/api/stripe/checkout` succeeds.
  - Props: `{ lead_id, amount_cents, currency }`.

- **payment_succeeded**
  - When: Stripe webhook marks payment and lead as `deposit_paid`.
  - Props: `{ payment_id, lead_id }`.

- **login_success**
  - When: `/auth/callback` finishes successfully.
  - Props: `{ role, has_profile }`.

- **signup_success**
  - When: signup completes and profile is created.
  - Props: `{ profile_id, email }`.

- **feedback_submitted**
  - When: `/api/feedback` returns 200.
  - Props: `{ page }`.

### 4. Implementation strategy

- **Phase 1 (this sprint)**
  - Create `lib/analytics.ts` with a small `trackEvent(name, payload)` helper.
  - Wire only the safest, non-critical events:
    - `assessment_started` (client-side only).
    - `feedback_submitted` (client-side, after `/api/feedback` 200).
  - Keep implementation as a **no-op** in production (dev-only console logging).

- **Phase 2 (future)**
  - Choose provider (e.g. PostHog, Vercel Analytics).
  - Update `trackEvent` to forward events to the provider SDK.
  - Add feature flags or env-based gating.

- **Phase 3 (future)**
  - Add server-side events for:
    - `assessment_submitted` (inside `/api/leads` handler).
    - `payment_succeeded` (inside Stripe webhook after success).

### 5. Admin visibility (future)

- Add a simple `/admin/analytics` view that:
  - Summarizes counts for:
    - Leads created per day.
    - Deposits paid per week.
    - Feedback count per page.
  - Uses existing Supabase queries; does not depend on external analytics.

