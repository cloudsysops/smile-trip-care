## Go-Live Readiness Report — Private Beta Stage

### 1. Current status

- **Auth & sessions**: ✅
  - Login, SSR sessions, and role-based redirects working.
- **Assessment**: ✅
  - `/assessment` → `/assessment/proposal` and `/admin/leads`.
- **Stripe**: ✅
  - Checkout + webhook update `payments`, `leads`, and `bookings`.
- **Patient journey**: ✅
  - `/patient` shows assessment, booking, and payment status.
- **Admin dashboards**: ✅
  - `/admin/overview`, `/admin/leads`, `/admin/payments/metrics`.
- **Hardening**: ✅
  - Signup rate limiting on `/api/signup`.
  - Stripe webhook events persisted to `stripe_webhook_events`.
- **Feedback**: ✅
  - `beta_feedback` table + `/api/feedback`.
  - “Send feedback” entry point on `/assessment`, `/patient`, `/admin/overview`.
  - `/admin/feedback` for admin review.

### 2. Remaining risks before broad launch

- No external error monitoring yet (e.g. Sentry) — errors depend on logs.
- Analytics events are defined but not yet wired to a provider.
- Multi-role system is only partially implemented (guards still single-role).
- Patient pipeline writes beyond `lead_created` are still in early phases.

### 3. Required checks before calling Deploy ✅

1. **Environment sanity**
   - Vercel:
     - Latest `main` deploy is **Ready** on the private beta host.
     - All Supabase env vars set.
   - Supabase:
     - All migrations applied, including:
       - `0022_patient_pipeline.sql`
       - `0023_profile_roles.sql`
       - `0024_beta_feedback.sql`
       - `0011_payment_reliability.sql` (stripe_webhook_events).

2. **End-to-end test sale**
   - Assessment → proposal → deposit checkout → Stripe payment → webhook:
     - `payments.status = 'succeeded'`.
     - `leads.status = 'deposit_paid'`.
     - `/patient` shows deposit received state.
   - `stripe_webhook_events` row exists for the event.

3. **Feedback loop**
   - At least a handful of testers have:
     - Submitted assessments.
     - Reached payment step (success or close).
     - Submitted feedback via “Send feedback”.
   - `/admin/feedback` shows:
     - No repeated severe blockers.
     - Any critical issues are either fixed or scheduled.

4. **Operational readiness**

   - Cristian/admin knows:
     - How to promote/demote admin users (`QA_ADMIN_ACCESS_SETUP.md`).
     - How to check health (`/api/health`, `/api/health/ready`).
     - How to inspect leads/payments/bookings in Supabase.
   - Run through:
     - `docs/DEPLOY_CHECKLIST.md`
     - `docs/PRODUCTION_OBSERVABILITY_BASELINE.md`
     - `docs/PRIVATE_BETA_RUNBOOK.md`

### 4. Recommendation

- **Status**: Ready for controlled private beta invite expansion.
- **Next step**: Focus next sprint on:
  - Light UX polish on `/patient` and `/assessment`.
  - Wiring a minimal analytics provider to `trackEvent`.
  - Deepening patient_pipeline usage for post-deposit stages.

