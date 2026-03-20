## Production Observability Baseline

### 1. Critical flows and where to look

- **Auth / login**
  - Routes: `/login`, `/auth/callback`, `/api/auth/me`.
  - Logs:
    - `auth/callback: ...` — session + profile resolution and redirects.
    - `auth/me: 401 (no session or no active profile)` — unauthenticated or inactive.
    - `auth/me: 200` with `role` — resolved role and redirect path.
  - Where:
    - Vercel logs (production / preview).
    - Local `npm run dev` terminal.

- **Leads / assessment**
  - Route: `POST /api/leads`.
  - Logs:
    - `POST /api/leads hit` with `request_id`.
    - `Lead validation failed` — zod validation errors.
    - `Lead created` — successful insert, includes `lead_id`.
    - `Lead-created automation enqueue failed` — automation worker issues (non-fatal for lead creation).

- **Checkout / Stripe**
  - Route: `POST /api/stripe/checkout`.
  - Logs:
    - `stripe/checkout: request received` — entry point.
    - `stripe/checkout: parsed body` — payload summary (no card data).
    - `stripe/checkout: failed to validate lead before checkout` — upstream validation error.
    - `stripe/checkout: Stripe session creation failed` — Stripe-side problem.

- **Stripe webhook**
  - Route: `POST /api/stripe/webhook`.
  - Logs:
    - `Stripe webhook env missing` — misconfigured env vars.
    - `Webhook missing stripe-signature` / `Invalid signature` — integration issue.
    - `Stripe event received` with `type`.
    - `checkout.session.completed with payment_status not paid` — noisy or premature webhook.
    - `Failed to lookup payment by session` / `Failed to update lead status` — DB issues.

- **Automation / outbound**
  - Routes: `/api/automation/worker`, `/api/automation/outbound-worker`, `/api/automation/followups`.
  - Logs:
    - `Automation job execution started/success/retry/dead_letter`.
    - `Outbound send started/succeeded/failed`.

### 2. Database-level observability

- **Tables to inspect for live operations**
  - `leads` — funnel entry; check `status`, `created_at`, and attribution (`utm_*`, `landing_path`).
  - `payments` — payment rows; `status = 'succeeded'` and `stripe_checkout_session_id`.
  - `bookings` — downstream booking status (e.g. `deposit_paid`).
  - `stripe_webhook_events` — **webhook audit trail**:
    - `stripe_event_id`, `event_type`, `status`, `payload_json`, `received_at`.
    - Written by the webhook handler for successful, paid checkout sessions.
  - `beta_feedback` — private beta feedback (new in this sprint).

### 3. Current logging guarantees

- Every critical API route creates a `request_id` and uses the shared logger.
- Sensitive data (card details, full session objects) is never logged.
- For each key flow there is at least:
  - An **entry log** (route hit).
  - A **success log** (e.g. `Lead created`, `Automation job execution success`).
  - An **error log** with message and identifiers (lead id, job id, session id).

### 4. Stripe-specific observability

- **Stripe dashboard**
  - Webhook logs show delivery status and event payloads.
  - Match `stripe_event_id` from Stripe with `stripe_webhook_events.stripe_event_id`.

- **Webhook audit table**
  - On successful, paid checkout session events:
    - Insert into `stripe_webhook_events` with:
      - `stripe_event_id`
      - `event_type`
      - `payload_json`
      - `received_at`
      - `status = 'received'`
  - Insert failures are logged but do **not** break payment handling.

### 5. Planned improvements (future work, not yet implemented)

- Wire `trackEvent` (see `lib/analytics.ts`) into:
  - Landing views.
  - Assessment start / submit.
  - Checkout start / payment success.
  - Feedback submission.
- Add Sentry or similar for:
  - Uncaught exceptions.
  - Performance traces on key pages.
- Add admin-facing observability dashboards:
  - Operational status (Stripe webhooks, Supabase, automation queues).
  - Funnel metrics (lead → proposal → deposit).

