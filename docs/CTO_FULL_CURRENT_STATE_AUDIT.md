# CTO Full Current State Audit — Nebula Smile

**Date:** 2026-03-08  
**Constraint:** Analysis only. No files modified.

---

## 1. Current Architecture Summary

### Repository structure

| Area | Contents |
|------|----------|
| **Important folders** | `app/` (pages, API route handlers, components), `lib/` (auth, supabase, ai, automation, outbound, payments, rate-limit, validation, config), `supabase/migrations/`, `tests/`, `docs/`, `scripts/`, `infrastructure/environments/`, `.github/workflows/` |
| **Major app routes** | `/` (landing), `/assessment`, `/packages`, `/packages/[slug]`, `/health-packages`, `/tour-experiences`, `/thank-you`, `/legal`, `/login`, `/signin`, `/signup`, `/admin` (→ overview), `/admin/overview`, `/admin/leads`, `/admin/leads/[id]`, `/admin/providers`, `/admin/specialists`, `/admin/experiences`, `/admin/bookings`, `/admin/consultations`, `/admin/assets`, `/admin/outbound`, `/admin/status`, `/admin/login`, `/provider`, `/specialist`, `/coordinator`, `/patient`, `/specialists/[slug]` |
| **API routes** | **Public:** `POST /api/leads`, `GET /api/health`, `GET /api/health/ready`, `GET /api/status`. **Auth:** `GET /api/auth/me`, `POST /api/auth/signout`, `POST /api/signup`. **Stripe:** `POST /api/stripe/checkout`, `POST /api/stripe/webhook`. **Admin (requireAdmin):** `/api/admin/*` (leads, leads/[id], leads/[id]/outbound, providers, providers/[id], specialists, specialists/[id], experiences, experiences/[id], bookings, bookings/[id], consultations, consultations/[id], packages/[id], assets, assets/[id], assets/upload, outbound/queue, outbound/metrics, outbound-messages/[id], payments/metrics, status/automation, ai/triage, ai/respond, ai/itinerary, ai/ops). **AI (admin):** `/api/ai/triage`, `/api/ai/respond`, `/api/ai/itinerary`. **Automation:** `/api/automation/worker`, `/api/automation/outbound-worker`, `/api/automation/followups`, `/api/automation/payments-reconcile`. |
| **Docs** | 60+ markdown files in `docs/`: AUTH_AND_ROLES, DASHBOARD_ROLES, DATA_MODEL, DEPLOY_CHECKLIST, TEST_FIRST_SALE, PLAN_AGENTES_PRODUCCION_Y_MEJORAS, ENV_Y_STRIPE, CURATED_NETWORK_*, PHASED_IMPLEMENTATION, GIT_AND_GITHUB_WORKFLOW, BRANCH_PROTECTION_SETUP, LOCAL_SETUP, VERCEL_*, various CTO/audit reports. |
| **Scripts** | `verify_all.sh`, `run_migrations.sh`, `env_check.sh`, `deploy_verify.sh`, `smoke_test.sh`, `verify_production.sh`, `sprint-start.sh`, `sprint-end.sh`, `dev_up.sh`, `dev_down.sh`, `bootstrap.sh`, `check_env.sh`, `smoke_assets_validation.js`, `run_seed_marketplace.sh`. |
| **Migrations** | 20 SQL files: `0001_init.sql` through `0020_leads_recommended_package.sql` (see MIGRATION_ORDER.md). Core: profiles, packages, leads, payments, assets, itineraries, lead_ai; then automation jobs, outbound_messages, payment idempotency, stripe_webhook_events, specialists/consultations/experiences, marketplace providers/packages/experiences, curated network, profiles roles/dashboards, leads recommended package. |
| **Tests** | 23 test files, 69 tests (Vitest). Coverage: leads API (validation, honeypot), stripe checkout, stripe webhook, health, smoke, auth role, admin APIs (validation, 403), automation worker/queue/lock-recovery/followups, outbound API/worker/command-center, payments reconcile, payments reliability lib, assessment extended, curated-network validation, ai-schemas, providers API. |

### Tech stack in use

- Next.js 16.1.6 (App Router), React 19, TypeScript, Tailwind.
- Supabase (Postgres, Auth, Storage), RLS enabled on core tables.
- Stripe (Checkout + webhook); Zod for validation; Vitest for tests; Vercel for deploy.
- Middleware: `proxy.ts` (Next.js 16 “Proxy (Middleware)”) calls `updateSession` from `lib/supabase/middleware.ts`; protects `/admin*` (redirect to `/admin/login` when unauthenticated).

---

## 2. Feature Status Table

| # | Area | Status | Notes |
|---|------|--------|-------|
| 1 | **Landing page** | Complete | `/` with hero, trust (Clínica San Martín), packages from DB, CTAs to assessment/packages. |
| 2 | **Package system** | Complete | Packages table, slug, location, duration_days, deposit_cents, published; seed scripts; admin CRUD. |
| 3 | **Package detail pages** | Complete | `/packages`, `/packages/[slug]`; show name, location, description, duration, deposit, included, itinerary; optional journey cities in schema. |
| 4 | **Assessment flow** | Complete | Form with honeypot, package prefill from query; POST `/api/leads`; redirect to thank-you with lead_id. |
| 5 | **Recommended package flow** | Complete | Lead stores recommended_package_slug/id from assessment; thank-you shows recommendation + disclaimer; admin can override in lead detail; checkout uses recommended ?? package for amount. |
| 6 | **Lead capture** | Complete | Zod validation, honeypot, rate limit, service-role insert; creates lead + optional booking; enqueues lead-created automation. |
| 7 | **Auth / login / signup** | Complete | Login at `/login` (Supabase signInWithPassword, then GET /api/auth/me → role redirect). Patient signup at `/signup` + POST `/api/signup` (profile role=patient). No forgot password. |
| 8 | **Role system** | Complete | profiles.role (admin, coordinator, provider_manager, specialist, patient, user); requireAdmin/requireCoordinator/requireProviderManager/requireSpecialist/requirePatient in lib/auth.ts; is_active respected. |
| 9 | **Dashboards by role** | Complete | /admin (requireAdmin), /provider (requireProviderManager), /specialist (requireSpecialist), /coordinator (requireCoordinator), /patient (requirePatient); each uses role-scoped data from lib/dashboard-data.ts. |
| 10 | **Admin dashboard** | Complete | Overview, leads (list/detail with status, AI, recommendation, deposit), providers, specialists, experiences, bookings, consultations, assets, outbound, status; all admin APIs guarded. |
| 11 | **Specialists** | Complete | Table, migrations, admin CRUD, specialist dashboard scoped by specialist_id; consultations per specialist. |
| 12 | **Providers** | Complete | Table, migrations, admin CRUD; provider dashboard scoped by provider_id; packages/specialists/experiences/bookings per provider. |
| 13 | **Experiences** | Complete | Table, migrations, admin CRUD; linked to providers; tour-experiences page. |
| 14 | **Bookings** | Complete | Created on lead insert when package_id present; webhook updates status to deposit_paid; admin bookings list/detail. |
| 15 | **Consultations** | Complete | Table, admin CRUD; specialist dashboard shows consultations. |
| 16 | **Stripe checkout** | Complete | POST /api/stripe/checkout for admin or patient (patient only for own lead by email); server-side amount from package; payment row created; redirect URLs validated same-origin. |
| 17 | **Stripe webhook** | Complete | Raw body, signature verification; only checkout.session.completed with payment_status=paid; idempotent; updates payments, leads, bookings; enqueues deposit_paid automation. Webhook does **not** persist events to stripe_webhook_events (table exists; admin metrics read it). |
| 18 | **Patient dashboard** | Complete | /patient with requirePatient(); getPatientDashboardData(email); profile summary, leads/bookings/payments by email; Pay deposit (PatientDepositButton) for own leads. |
| 19 | **Deployment readiness** | Partial | Vercel + Supabase + Stripe documented; DEPLOY_CHECKLIST and TEST_FIRST_SALE exist. Deploy track “Casi listo” in STATUS; webhook and env need verification in target environment; one full E2E sale not yet signed off. |
| 20 | **GitHub/DevOps/tooling readiness** | Complete | CI on push/PR (main, staging, dev, feature/*, hotfix/*): lint, test, env validation, build. Branch protection docs (BRANCH_PROTECTION_SETUP, GIT_AND_GITHUB_WORKFLOW). Scripts: verify, deploy_verify, migrations, smoke. |

**Summary:** 18 complete, 1 partial (deployment readiness), 0 missing, 0 classified risky in the table. Optional gap: webhook event persistence for audit (stripe_webhook_events not written by webhook handler).

---

## 3. Security and Production Readiness

### Route protection

- **Middleware:** Only `/admin*` (except `/admin/login`) redirects to login when no user. Implemented in `lib/supabase/middleware.ts` via `updateSession`, invoked by `proxy.ts` (Next.js 16 Proxy middleware).
- **Role dashboards:** `/provider`, `/specialist`, `/coordinator`, `/patient` have **no** middleware check; each page calls `require*()` and on throw redirects to `/login?next=...`. So protection is page-level only; acceptable but could be centralized in middleware later.
- **Admin APIs:** All use `requireAdmin()` (or equivalent) at start of handler; 403/401 on failure.
- **Checkout API:** Uses `getCurrentProfile()`; allows only admin or patient; patient restricted to `lead.email === profile.email` (case-insensitive).
- **Leads API:** Public (no auth); protected by honeypot and rate limit.

### Role guards

- Consistent: `requireAdmin`, `requireCoordinator`, `requireProviderManager`, `requireSpecialist`, `requirePatient` used in pages and APIs. All derive from `getCurrentProfile()` and check `profile.role` and `is_active`. No client-only guards relied on for security.

### Service role handling

- Server-only: `getServerSupabase()` used in Route Handlers and Server Components; service role key from env. Not exposed to client. Dashboard data (e.g. getPatientDashboardData) uses service role and applies scope in application code (email, provider_id, specialist_id).

### Stripe webhook safety

- **Signature:** Verified with `stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)`; raw body via `request.text()`. Invalid signature → 400.
- **Event handling:** Only `checkout.session.completed`; `mode === "payment"` and `payment_status === "paid"` required; metadata lead_id validated with Zod.
- **Idempotency:** Duplicate session handled (existing payment row or unique violation on insert); lead/booking status update uses conditional so replay does not break state.
- **No card/PII logged.** Good for production.

### RLS usage

- RLS enabled on: profiles, packages, leads, payments, assets, itineraries, lead_ai, and (per migrations) on automation/outbound/marketplace/curated tables. Policies use `is_admin()` for admin-only; profiles own read/update. Dashboard reads use service role (bypass RLS) with app-layer scoping.

### Environment variable handling

- Required vars documented in `.env.example` and ENV_Y_STRIPE: Supabase URL/keys, Stripe secret/publishable/webhook secret. CI runs `env_check.sh` with placeholders. No secrets in repo.

### Deployment readiness

- **Code:** `npm run verify` passes (lint, 69 tests, build). Build shows “Proxy (Middleware)” and all app/API routes.
- **Docs:** DEPLOY_CHECKLIST, TEST_FIRST_SALE, PRIMER_ADMIN, ENV_Y_STRIPE. Missing: single signed-off “first sale” run and Deploy ✅ in STATUS for production URL.
- **Infra:** Single Vercel project (e.g. -dev), migrations 0001–0020, seed optional. No dedicated staging DB/project required for launch.

### Test coverage quality

- **Strength:** Critical paths covered: leads (validation, honeypot, no DB on honeypot), stripe checkout (admin context, return URL validation), stripe webhook (signature, mode, payment_status), health, auth role redirect, admin 403, automation worker/queue, outbound worker. 69 tests, 23 files.
- **Gap:** One test run logs “Lead-created automation enqueue failed” with “supabase.from(...).upsert is not a function” — comes from test mock (leads-api.test.ts), not production code. E2E (e.g. assessment → thank-you) not present; optional for launch.

---

## 4. Data Model Analysis

### Core entities

- **profiles** — Extends auth.users; role, provider_id, specialist_id, is_active. Sufficient for admin/coordinator/provider_manager/specialist/patient.
- **packages** — slug, name, location, duration_days, deposit_cents, included, itinerary_outline, published; later migrations add provider_id, package_type, origin_city, destination_city, etc. Supports Medellín/Manizales and dual-city.
- **leads** — first_name, last_name, email, phone, country, package_slug, package_id, message, status, recommended_package_slug, recommended_package_id, attribution, follow-up fields. Supports assessment → recommendation → deposit flow.
- **payments** — lead_id, stripe_checkout_session_id, amount_cents, status; idempotency constraints.
- **bookings** — lead_id, package_id, provider_id, status, deposit_cents; created on lead insert; updated by webhook.
- **providers** — name, city, approval_status, slug, provider_type, published, etc. (curated network).
- **specialists** — provider_id, name, specialty, approval_status, slug, etc.
- **experiences** — provider_id, category, etc.
- **consultations** — link leads/specialists/status.
- **lead_ai, ai_automation_jobs, outbound_messages, stripe_webhook_events** — support AI, automation, and audit.

### Package / specialist / provider / experience model

- **Strong enough for launch:** Providers and specialists have approval_status and published; packages link to providers; experiences link to providers; junction tables (e.g. package_experiences, package_specialists) exist in later migrations. Curated network (invite/approve) is in place. No need for a massive redesign for “curated private network” or Medellín/Manizales/dual-city; schema supports it.

### Role model

- **Strong enough:** Single role per user; provider_id/specialist_id scope provider and specialist dashboards; coordinator has broad read; patient scoped by email. No RBAC matrix required for MVP.

### Readiness for curated private network

- **Yes.** Admins create/invite providers and specialists; approval workflow and published flags control visibility; no public signup for non-patients. Data model and docs (CURATED_NETWORK_*, DASHBOARD_ROLES) align with this.

---

## 5. Top Risks

1. **Webhook events not persisted** — Table `stripe_webhook_events` exists and admin metrics read it, but the webhook handler does not insert rows. Audit trail and metrics for webhook processing are incomplete; debugging failed or duplicate webhooks is harder.
2. **No rate limit on signup/login** — Leads API is rate-limited; `/api/signup` and login path are not. Abuse (signup spam, credential stuffing) is possible; recommend adding rate limiting before or soon after launch.
3. **Email confirmation vs signup** — If Supabase is set to require email confirmation, the user may not have a session immediately after signUp, so POST `/api/signup` might run before session and fail or create a race. Document or handle (e.g. “Confirm your email” then sign in).
4. **Middleware only protects /admin** — Provider/specialist/coordinator/patient routes are protected only in the page (require* → redirect). A direct hit still runs the page and then redirects; no information leak observed but attack surface is slightly larger than with middleware.
5. **SECURITY.md contact placeholder** — “indicar email de contacto” not replaced; replace before or at launch for responsible disclosure.

---

## 6. Launch Blockers

- **No hard code blockers.** The application is feature-complete for the stated business goals (patient signup/login, admin operations, recommended packages, deposit payments, role dashboards, Medellín/Manizales).
- **Operational prerequisites (must be done before first paid sale):**
  1. Apply migrations 0001–0020 to production Supabase and run seed if needed.
  2. Create at least one admin user (Supabase Auth + profiles.role = 'admin').
  3. Configure Stripe webhook endpoint for production URL (`/api/stripe/webhook`, event `checkout.session.completed`) and set `STRIPE_WEBHOOK_SECRET` in Vercel; redeploy if added after deploy.
  4. Execute one full flow per TEST_FIRST_SALE and confirm in DB: payments.status = succeeded, leads.status = deposit_paid.
  5. Mark DEPLOY_CHECKLIST and (if used) CHECKLIST_PRIMERA_VENTA complete; set Deploy ✅ in STATUS.md for the production URL.

---

## 7. What Can Wait

- **Webhook event persistence** — Improve audit and metrics; not required for first sales.
- **Rate limiting on signup/login** — Recommended soon; not a launch blocker if traffic is controlled.
- **Forgot password** — Backlog (e.g. M11 in PLAN_AGENTES); can wait.
- **E2E tests** — Nice to have; manual TEST_FIRST_SALE is sufficient for launch.
- **Sentry (or similar)** — Observability improvement; can be added post-launch.
- **Staging environment** — Optional (M10); single production deploy is acceptable for soft launch.
- **Middleware for /provider, /specialist, /coordinator, /patient** — Consistency improvement; current page-level guards are sufficient.
- **Custom domain** — Can be added when branding is final.

---

## 8. Single Recommended Next Sprint

**Sprint: Launch verification and first sale**

- **Goal:** Treat the current codebase as release-ready and close the “Casi listo” gap by verifying deployment and completing one documented first sale on the target environment (e.g. production or -dev).
- **Why it matters:** Confirms that production env, DB, Stripe webhook, and admin/patient flows work end-to-end and unblocks “Deploy ✅” and investor demos.
- **What it should include:**
  - Confirm Vercel env (Supabase + Stripe, including STRIPE_WEBHOOK_SECRET) for the target URL.
  - Confirm migrations 0001–0020 applied; at least one admin exists.
  - Confirm Stripe webhook endpoint and “Send test webhook” → 200.
  - Run TEST_FIRST_SALE once: assessment → thank-you → admin (or patient) → Collect deposit → Stripe test card → success; verify in Supabase (payments.status, leads.status).
  - Update DEPLOY_CHECKLIST and CHECKLIST_PRIMERA_VENTA; set Deploy ✅ in STATUS.md; document production URL where appropriate.
- **Files likely involved:** None or minimal (docs only): `docs/DEPLOY_CHECKLIST.md`, `docs/CHECKLIST_PRIMERA_VENTA.md`, `STATUS.md`, possibly README or PLAN_AGENTES for URL. No code or schema changes required.
- **Safe vs sensitive:** **Safe.** Purely verification and documentation; no auth, payments, or RLS logic changes. No code implementation required in repo; can be executed by DevOps/QA with access to Vercel, Supabase, and Stripe.

---

## 9. Safe vs Sensitive Classification of That Sprint

- **Classification:** **Safe.**  
- **Reason:** The sprint is verification and checklist completion only. It does not modify migrations, auth, Stripe logic, or role guards. It can be implemented immediately as a runbook execution (and doc updates); no prior planning of code changes is needed.

---

**End of audit. No files were modified.**
