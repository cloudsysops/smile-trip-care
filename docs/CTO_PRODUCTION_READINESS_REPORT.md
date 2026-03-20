# CTO Production Readiness Report — Nebula Smile

**Date:** 2026-03-08  
**Scope:** Technical architecture, security, launch readiness, and engineering plan.  
**Constraint:** Analysis only; no repository changes.

---

## 1. Repository Architecture Summary

### 1.1 High-level structure

| Layer | Technology | Location |
|-------|------------|----------|
| **App** | Next.js 16 (App Router), React 19, TypeScript | `app/` |
| **API** | Route Handlers (server-side) | `app/api/` |
| **Data / Auth** | Supabase (Postgres, Auth, Storage) | `lib/supabase/`, Supabase project |
| **Payments** | Stripe Checkout + webhook | `app/api/stripe/`, `lib/payments/` |
| **Validation** | Zod | `lib/validation/` |
| **AI / Automation** | OpenAI agents, queue, workers | `lib/ai/`, `lib/automation/`, `lib/outbound/` |
| **Database** | Migrations (ordered 0001 → 0020) | `supabase/migrations/` |
| **Tests** | Vitest | `tests/` |
| **CI** | GitHub Actions (lint, test, env check, build) | `.github/workflows/ci.yml` |
| **Deploy** | Vercel | Config in Vercel; docs in `docs/` |

### 1.2 Main domains

- **Public:** Landing (`/`), assessment (`/assessment`), packages (`/packages`, `/packages/[slug]`), thank-you (`/thank-you`), tour experiences, legal, login (`/login`), signup (`/signup`), signin (redirects to `/login`).
- **Auth:** Supabase Auth; profiles table with `role` (admin, coordinator, provider_manager, specialist, patient, user). Login uses `GET /api/auth/me` for role-based redirect.
- **Admin:** `/admin` (overview, leads, lead detail, providers, specialists, experiences, bookings, consultations, assets, outbound, status). All guarded by `requireAdmin()`.
- **Role dashboards:** `/provider`, `/specialist`, `/coordinator`, `/patient` — each guarded by the corresponding `require*()` in the page; unauthenticated or wrong role → redirect to `/login`.
- **Leads:** POST `/api/leads` (Zod, honeypot, rate limit, service-role insert); creates lead + optional booking; enqueues lead-created automation.
- **Payments:** POST `/api/stripe/checkout` (admin or patient; patient only for own lead by email). Webhook `POST /api/stripe/webhook` (raw body, signature verification, `checkout.session.completed`, payment_status=paid, idempotent).

### 1.3 Data flow (simplified)

```
User → Assessment → POST /api/leads → leads (+ optional bookings)
                     → Automation queue (triage/respond)
Admin/Patient → Collect deposit → POST /api/stripe/checkout → Stripe Checkout
Stripe → Webhook → /api/stripe/webhook → payments (succeeded), leads (deposit_paid), bookings (deposit_paid), automation (deposit_paid jobs)
```

---

## 2. System Map

### 2.1 Core tables (RLS in place)

| Table | Purpose | RLS / access |
|-------|---------|---------------|
| **profiles** | User profile + role, provider_id, specialist_id | Own read/update; admin all; trigger creates profile on auth signup (role `user`) |
| **packages** | Catalog (Medellín, Manizales, etc.) | Public SELECT when published; admin all |
| **leads** | Assessment submissions, status, recommended_package_* | Admin only (app uses service role for dashboard data) |
| **payments** | Stripe sessions, amount, status | Admin only |
| **bookings** | Lead–package–provider link, status | Via migrations (admin / service role) |
| **providers, specialists, experiences** | Marketplace / curated network | Published+approved policies (migrations 0014–0017) |
| **lead_ai** | AI outputs, notes per lead | Admin only |
| **ai_automation_jobs** | Durable automation queue | Admin only |
| **outbound_messages** | Outbound queue and tracking | Admin only |
| **stripe_webhook_events** | Webhook audit (M19) | Admin read; **webhook handler does not write to it** (gap) |

### 2.2 Auth and route protection

- **Middleware:** `lib/supabase/middleware.ts` → `updateSession()`. Only protects `/admin*` (redirect to `/admin/login` if no user). **Note:** Next.js expects root `middleware.ts`; current entry is `proxy.ts` — confirm it is actually used as middleware (e.g. root `middleware.ts` exporting the matcher and calling `updateSession`).
- **Role dashboards:** `/provider`, `/specialist`, `/coordinator`, `/patient` are protected only in the page (e.g. `requireProviderManager()` → throw → catch → `redirect("/login?next=/provider")`). No middleware for these paths; direct hit runs the page and triggers redirect. **Acceptable** but consider centralizing in middleware for consistency.
- **APIs:** Admin APIs use `requireAdmin()`; checkout uses `getCurrentProfile()` and allows admin or patient (patient restricted to own lead by email).

### 2.3 Key files

| Area | Files |
|------|--------|
| Auth | `lib/auth.ts`, `app/api/auth/me/route.ts`, `app/api/signup/route.ts`, `app/login/page.tsx`, `app/signup/page.tsx` |
| Stripe | `app/api/stripe/checkout/route.ts`, `app/api/stripe/webhook/route.ts`, `lib/payments/reliability.ts` |
| Leads | `app/api/leads/route.ts`, `lib/validation/lead.ts` |
| Admin | `app/admin/**`, `app/api/admin/**` |
| Dashboards | `app/patient/page.tsx`, `app/provider/page.tsx`, `app/specialist/page.tsx`, `app/coordinator/page.tsx`, `lib/dashboard-data.ts` |

---

## 3. Feature Status Table

| Feature | Status | Notes |
|---------|--------|--------|
| **User signup** | ✅ Done | `/signup` + POST `/api/signup` — patient only; creates profile with role `patient`. |
| **User login** | ✅ Done | `/login`; Supabase `signInWithPassword`; GET `/api/auth/me` → role redirect. |
| **Lead capture (assessment)** | ✅ Done | Form with honeypot, rate limit, Zod; POST `/api/leads`; recommended package stored. |
| **Package recommendation** | ✅ Done | From assessment; thank-you shows recommendation; admin can override in lead detail. |
| **Admin collect deposits** | ✅ Done | Lead detail → DepositButton → Stripe Checkout; amount from package. |
| **Patient pay deposit** | ✅ Done | `/patient` → PatientDepositButton for own leads (email match) → same checkout API. |
| **Stripe webhook** | ✅ Done | Signature verification, raw body, paid-only, idempotent; updates payments, leads, bookings; enqueues deposit_paid automation. |
| **Admin dashboard** | ✅ Done | Overview, leads, providers, specialists, experiences, bookings, consultations, assets, outbound, status. |
| **Provider dashboard** | ✅ Done | Scoped by provider_id; packages, specialists, experiences, bookings. |
| **Specialist dashboard** | ✅ Done | Scoped by specialist_id; consultations. |
| **Coordinator dashboard** | ✅ Done | Active leads, bookings, consultations. |
| **Patient dashboard** | ✅ Done | Own leads/bookings/payments by email; Pay deposit CTA. |
| **Marketplace (packages/locations)** | ✅ Done | Packages with location; Medellín/Manizales; providers, specialists, experiences in DB and migrations. |
| **Webhook event audit table** | ⚠️ Partial | Table `stripe_webhook_events` exists and is read in admin metrics; **webhook route does not persist events** — audit trail incomplete. |
| **Middleware for non-admin roles** | ⚠️ Partial | Only `/admin` protected in middleware; provider/specialist/coordinator/patient protected in page only. |
| **Forgot password** | ❌ Missing | Not implemented; doc lists as backlog (M11). |
| **Email confirmation (signup)** | ⚠️ Config | If Supabase requires email confirmation, POST `/api/signup` may run before session; doc notes risk. |
| **Rate limit (signup/login)** | ❌ Not found | Leads API has rate limit; signup/login do not (consider for production). |

---

## 4. Security Analysis

### 4.1 Strengths

- **Stripe webhook:** Raw body used for signature verification; invalid signature → 400. Only `checkout.session.completed` with `payment_status === "paid"` updates state; client amount ignored in checkout (server-side pricing).
- **Payments:** Idempotency (unique stripe_checkout_session_id); duplicate session handled; lead/booking status update is conditional (`neq status deposit_paid`).
- **Leads API:** No auth required (public form); Zod validation; honeypot (`company_website`); rate limit (e.g. 10/min); service-role insert only; no PII in logs beyond what’s needed.
- **Checkout API:** Admin or patient only; patient restricted to `lead.email === profile.email` (case-insensitive).
- **Auth:** Role in `profiles`; server-side guards (`requireAdmin()`, etc.) on every protected page/API; `is_active` respected in `getCurrentProfile()`.
- **RLS:** Core tables have RLS; `is_admin()` used for admin-only policies; profiles own read/update.
- **Secrets:** Env-based (`.env.example` documents; no secrets in repo); CI validates env shape with placeholders.
- **Security doc:** SECURITY.md describes reporting and good practices.

### 4.2 Risks and gaps

| Risk | Severity | Recommendation |
|------|----------|-----------------|
| **Webhook events not persisted** | Medium | Persist received webhook events (at least event_id, type, status) in `stripe_webhook_events` in the webhook handler for audit and metrics accuracy. |
| **Middleware entry point** | Low | Ensure root `middleware.ts` exists and calls `updateSession` (or rename `proxy.ts` / adjust Next.js config so middleware is active). |
| **No rate limit on signup/login** | Medium | Add rate limiting (e.g. per IP) on `/api/signup` and login path to reduce abuse and credential stuffing. |
| **Patient/coordinator/provider/specialist routes** | Low | Only page-level guards; consider middleware for `/provider`, `/specialist`, `/coordinator`, `/patient` to avoid running server logic before redirect. |
| **Email confirmation vs signup** | Low | If email confirmation is enabled in Supabase, document flow (e.g. “Confirm your email” then sign in) or handle in UI so POST `/api/signup` runs with session. |
| **RLS and service role** | Info | Dashboard data uses service role (bypasses RLS). Ensure no client ever gets service role; all role-scoping is in app layer (dashboard-data, require*). |
| **SECURITY.md contact** | Low | Replace placeholder “indicar email de contacto” with real security contact. |

### 4.3 Data safety

- **PII:** Leads and profiles hold PII (name, email, phone). Access: admin (all), patient (own by email), coordinator (operational). RLS limits direct DB access; app uses service role only server-side.
- **Payments:** No card data stored; Stripe handles PCI; only session ID, amount, status stored.
- **Logs:** Avoid logging full session objects or card data; current webhook code does not log payment/card details.

---

## 5. Launch Readiness Score

**Overall: 78%**

| Dimension | Score | Notes |
|-----------|-------|--------|
| **Core flow (lead → deposit)** | 95% | End-to-end implemented; checkout server-side pricing; webhook idempotent and paid-only. |
| **Auth & roles** | 85% | Login, signup (patient), role redirect, all dashboards guarded; no forgot password; signup rate limit missing. |
| **Payments & Stripe** | 90% | Checkout and webhook solid; webhook event persistence missing for audit. |
| **Admin & ops** | 90% | Admin and role dashboards in place; status and payment metrics exist. |
| **Security** | 75% | Good base (webhook verification, RLS, guards); rate limit on auth and webhook audit to improve. |
| **Testing & CI** | 85% | Vitest; many API tests; CI lint + test + build + env check; no E2E yet. |
| **Documentation** | 90% | AUTH_AND_ROLES, DASHBOARD_ROLES, DATA_MODEL, TEST_FIRST_SALE, DEPLOY_CHECKLIST, PLAN_AGENTES, etc. |
| **Infrastructure** | 80% | Vercel + Supabase + Stripe documented; migrations ordered; env example complete; no Sentry yet. |

**Verdict:** The platform is **suitable for a controlled production launch** (first sales, limited traffic) once the checklist below is completed. Reaching **90%+** readiness would require: webhook event persistence, rate limiting on signup/login, optional E2E smoke test, and Sentry (or similar) for errors.

---

## 6. Infrastructure Analysis

### 6.1 Current

- **App host:** Vercel (recommended in docs).
- **DB / Auth / Storage:** Supabase (single project; production).
- **Payments:** Stripe (test/live per env).
- **CI:** GitHub Actions on main, staging, dev, feature/**, hotfix/** — lint, test, env validation, build.
- **Migrations:** 0001 → 0020 (see MIGRATION_ORDER.md); apply with `npm run db:migrate` or SQL Editor.
- **Seeds:** Optional `scripts/seed_packages.sql`, `scripts/seed_marketplace_foundation.sql`.

### 6.2 Gaps

- **Staging:** No dedicated staging Supabase/Vercel project documented as mandatory; PLAN_AGENTES mentions optional M10.
- **Error monitoring:** Sentry (or similar) listed as backlog (M2); not implemented.
- **Webhook audit:** Table present; webhook handler does not write to it.
- **Middleware file:** Confirm `middleware.ts` at root and matcher so Supabase session refresh and /admin redirect work in production.

---

## 7. Minimum Features to Launch and Sell

**Already in place:**

1. User signup (patient) and login with role-based redirect.
2. Lead capture via assessment (honeypot, rate limit, recommended package).
3. Admin: view leads, recommend/override package, collect deposit (Stripe).
4. Patient: view own assessments, recommended package, pay deposit (own lead only).
5. Stripe Checkout with server-side amount; webhook updates payment and lead status; idempotent.
6. Dashboards for admin, provider, specialist, coordinator, patient (with guards).

**Minimum to complete before first paid sale:**

1. **Deploy:** Vercel env (Supabase + Stripe, including `STRIPE_WEBHOOK_SECRET`); Stripe webhook endpoint pointing to production URL; one successful “Send test webhook” → 200.
2. **Data:** All migrations 0001–0020 applied; at least one admin user (Supabase Auth + `profiles.role = 'admin'`); seed packages if needed.
3. **Verification:** One full flow: assessment → thank-you → admin (or patient) → Collect deposit → Stripe test card → success; confirm in Supabase: `payments.status = succeeded`, `leads.status = deposit_paid`.
4. **Docs:** DEPLOY_CHECKLIST and TEST_FIRST_SALE completed and signed off.

**Recommended before scaling:**

- Persist webhook events to `stripe_webhook_events`.
- Rate limit signup and login.
- Add error monitoring (e.g. Sentry).
- Optional: E2E smoke test for assessment → thank-you.

---

## 8. Production Launch Plan

### Phase A — Pre-deploy

1. **Code:** `npm run verify` (lint, test, build) passes.
2. **Env:** All required variables set in Vercel (see DEPLOY_CHECKLIST and .env.example): Supabase URL/keys, Stripe secret/publishable/webhook secret, optional OpenAI and automation secrets.
3. **DB:** Run migrations 0001–0020 on production Supabase; run seed scripts if applicable.
4. **Admin user:** Create at least one user in Supabase Auth and set `profiles.role = 'admin'` (see PRIMER_ADMIN.md).
5. **Middleware:** Confirm root `middleware.ts` (or equivalent) is active so `/admin` redirect and session refresh work.

### Phase B — Stripe

1. **Webhook:** In Stripe Dashboard add endpoint `https://<production-domain>/api/stripe/webhook`, event `checkout.session.completed`.
2. **Secret:** Copy signing secret into Vercel as `STRIPE_WEBHOOK_SECRET`; redeploy if added after first deploy.
3. **Test:** “Send test webhook” for `checkout.session.completed` → response 200.

### Phase C — Smoke and first sale

1. **Health:** `GET /api/health` and `GET /api/health/ready` return 200.
2. **First sale:** Follow TEST_FIRST_SALE.md (assessment → thank-you → admin or patient → Collect deposit → Stripe 4242... → success URL).
3. **DB check:** In Supabase: `payments.status = succeeded`, `leads.status = deposit_paid` for that lead.
4. **Checklists:** Mark DEPLOY_CHECKLIST and CHECKLIST_PRIMERA_VENTA; set Deploy ✅ in STATUS.md.

### Phase D — Admin and specialist onboarding

1. **Admin:** Create admins via Supabase Auth + profiles (role admin); document process.
2. **Coordinators / providers / specialists:** No self-signup; create Auth user + profile with correct role and `provider_id`/`specialist_id`; document in AUTH_AND_ROLES or runbook.
3. **Patients:** Can self-signup at `/signup`; no extra onboarding steps.

---

## 9. Security Best Practices for This SaaS

1. **Secrets:** Never commit secrets; use Vercel/Supabase env; rotate keys if exposed.
2. **Stripe:** Use live keys only in production; restrict webhook to `checkout.session.completed`; keep signature verification and raw body.
3. **Auth:** Rely on server-side role checks (`require*`) for every protected route and API; do not trust client-only checks.
4. **RLS:** Keep RLS on all tables; use service role only server-side; never expose service role to client.
5. **Input:** Validate all inputs with Zod (or equivalent); sanitize for display; use parameterized queries (Supabase client does).
6. **Rate limiting:** Keep leads rate limit; add rate limiting for signup and login in production.
7. **Logging:** Do not log PII or payment/card data; use request_id for correlation; consider structured logging.
8. **Dependencies:** Review Dependabot/audit; update dependencies with security patches.
9. **Security contact:** Set a real contact in SECURITY.md and optionally in repo settings.
10. **Incidents:** Define who handles security reports and how (SECURITY.md already outlines reporting).

---

## 10. Recommended Git Workflow

- **Branches:**  
  - `main` = production (deploy from here).  
  - `staging` / `dev` = optional pre-production.  
  - `feature/*`, `hotfix/*` = short-lived; merge via PR.

- **PR rules:**  
  - Require PR for `main` (and optionally for `staging`/`dev`).  
  - Require status checks: `CI / lint-and-build` (lint, test, build).  
  - Require branch up to date before merge.  
  - Do not allow bypassing (see BRANCH_PROTECTION_SETUP.md).

- **CI usage:**  
  - CI runs on push/PR to main, staging, dev, feature/**, hotfix/**.  
  - All changes to main should pass CI before merge.  
  - Use `npm run verify` locally before pushing.

- **Production deployment:**  
  - Deploy from `main` (Vercel linked to main).  
  - Tag or document release when marking Deploy ✅ (e.g. in STATUS.md).  
  - Hotfixes: branch from main → fix → PR → merge → deploy.

- **Sync:** Before starting work: `git fetch` / `git pull`; after work: commit with clear message and push (see git-commit-and-sync rule).

---

## 11. Next Engineering Sprints

### Sprint 1 — Launch hardening (1–2 weeks)

- Confirm root middleware (`middleware.ts`) and /admin protection.
- Persist Stripe webhook events in webhook handler (insert into `stripe_webhook_events`).
- Add rate limiting to POST `/api/signup` and to login (or login endpoint if separate).
- Complete DEPLOY_CHECKLIST and TEST_FIRST_SALE once in target environment; mark Deploy ✅ in STATUS.md.
- Document production URL and “how we sell” in README or plan.

### Sprint 2 — Observability and safety (1–2 weeks)

- Integrate Sentry (or similar) for server and optionally client errors.
- Optional: E2E smoke test (e.g. Playwright) for assessment → thank-you.
- Review RLS policies in production (document or tighten if needed).
- Set security contact in SECURITY.md.

### Sprint 3 — UX and scale prep (ongoing)

- Forgot password flow (Supabase reset) if required.
- Meta tags / Open Graph for landing and packages.
- Optional: staging Vercel + Supabase for pre-production tests.
- Optional: domain and WhatsApp number configuration (NEXT_PUBLIC_WHATSAPP_NUMBER).

### Sprint 4 — Marketplace and operations (backlog)

- Specialist onboarding runbook (invite flow or admin steps).
- Coordinator onboarding and training.
- Any marketplace UX (filters, discovery) beyond current packages and admin CRUD.

---

## 12. Summary

- **Architecture:** Next.js 16 App Router, Supabase (Auth + Postgres + Storage), Stripe Checkout + webhook, role-based dashboards, automation queue and workers. Structure is clear and documented.
- **Security:** Strong on webhook verification, server-side pricing, idempotency, RLS, and role guards. Main gaps: webhook event persistence, rate limiting on auth, and confirming middleware.
- **Features:** Signup (patient), login, lead capture, recommendation, admin and patient deposit collection, all five role dashboards, and marketplace schema are in place. Enough to launch and sell.
- **Readiness:** **78%** — suitable for controlled launch; **90%+** after webhook audit, auth rate limits, and error monitoring.
- **Launch:** Follow the production launch plan (pre-deploy, Stripe webhook, smoke, first sale, checklists); then run Sprints 1–2 for hardening and observability.

No code or repository changes were made in this analysis. Implement the recommendations in the order above and re-run this assessment after major changes.
