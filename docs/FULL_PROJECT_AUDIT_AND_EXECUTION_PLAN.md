# Full Project Audit + Execution Plan

**Role:** Permanent AI CTO for Nebula Smile  
**Date:** 2026-03-08  
**Purpose:** Engineering and product status report for launch; coordination between Cursor (codebase/infra) and ChatGPT (architecture, UX, product strategy).

---

## 1. Repository architecture summary

### 1.1 Current architecture

- **Pattern:** Monolithic Next.js 16 App Router app with server-side data (Supabase service role), cookie-based auth (Supabase SSR), and server components first.
- **No separate backend service:** All API logic lives in `app/api/` Route Handlers; Server Components use `getServerSupabase()` and `lib/*` for data.
- **Database:** Supabase Postgres with RLS; application layer uses service role for admin/operational writes and enforces role scoping in app code (provider_id, specialist_id, email).

### 1.2 Main technologies

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19.2.3, Tailwind CSS 4 |
| Language | TypeScript 5 |
| Database / Auth / Storage | Supabase (Postgres, Auth, RLS, Storage) |
| Payments | Stripe (Checkout Sessions, webhooks) |
| Validation | Zod |
| Testing | Vitest 4 |
| Lint | ESLint + eslint-config-next |
| Deploy | Vercel (implied; no GitHub Actions in repo) |

### 1.3 Folder structure

| Directory | Purpose |
|-----------|---------|
| **app/** | App Router: pages, layouts, API routes. Public pages (`/`, `/assessment`, `/packages`, `/login`), role dashboards (`/admin`, `/provider`, `/specialist`, `/coordinator`, `/patient`). |
| **app/api/** | Route Handlers: health, status, leads (POST), auth/me, auth/signout, stripe/checkout (admin), stripe/webhook, admin/* (CRUD providers, specialists, experiences, packages, consultations, bookings, leads, assets, AI). |
| **app/admin/** | Admin UI: overview, leads (list + [id]), providers, specialists, experiences, bookings, consultations, assets, login. All protected by `requireAdmin()`. |
| **app/components/** | Reusable UI: landing (package-card, specialist-card, experience-card, step-flow), marketplace (filters, cards). |
| **lib/** | Server-side logic: auth (guards, getCurrentProfile), config (server env schema), supabase (server + browser clients), logger, rate-limit; domain: providers, packages, specialists, experiences, consultations, bookings, dashboard-data; validation (Zod schemas); ai (schemas). |
| **supabase/migrations/** | Sequential SQL migrations 0001–0011: init (profiles, packages, leads, payments, assets, RLS), assets extended, AI, payments idempotency, specialists/consultations/experiences, marketplace providers/packages, marketplace foundation (bookings), curated network (approval), enterprise fields (0010), profiles roles/dashboards (0011). |
| **scripts/** | Shell: verify_all.sh (lint+test+build), run_migrations.sh, run_seed_marketplace.sh, deploy_verify.sh, smoke tests, sprint scripts. |
| **tests/** | Vitest: health, leads-api, assessment-extended, curated-network-validation, admin-api-validation, providers-api, auth-role, ai-schemas. 32 tests total. |
| **docs/** | Product/engineering docs: DATA_MODEL, AUTH_AND_ROLES, DASHBOARD_ROLES, ENV_Y_STRIPE, SECURITY_COMPLIANCE, ENGINEERING_HANDBOOK, sprint reports, checklists, agent plans. |

### 1.4 API routes (summary)

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/health` | GET | None | Liveness |
| `/api/health/ready` | GET | None | Readiness |
| `/api/status` | GET | None | Status payload |
| `/api/leads` | POST | None | Create lead (assessment); rate limit, honeypot |
| `/api/auth/me` | GET | Session | Role + redirectPath for login |
| `/api/auth/signout` | POST | Session | Sign out |
| `/api/stripe/checkout` | POST | Admin | Create Stripe Checkout Session (lead_id, amount_cents) |
| `/api/stripe/webhook` | POST | Stripe signature | checkout.session.completed → update payment |
| `/api/admin/*` | GET/POST/PATCH | Admin | CRUD providers, specialists, experiences, packages, consultations, bookings, leads, assets; AI (triage, respond, itinerary, ops) |

### 1.5 Database integrations

- **Supabase Postgres:** Single project; connection via `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for server. Migrations via CLI (`npm run db:migrate`) or SQL Editor; optional `DATABASE_URL` for psql/scripts.
- **Tables (main):** profiles, packages, leads, payments, assets, itineraries, lead_ai, providers, specialists, experiences, package_experiences, package_specialists, consultations, bookings. RLS enabled; `is_admin()` and role helpers used where needed.

### 1.6 Auth implementation

- **Supabase Auth:** Email/password; session in cookies via `@supabase/ssr` (`getAuthClient()` in server code).
- **Profiles:** `public.profiles` extends auth.users: id, email, full_name, role, provider_id, specialist_id, is_active, created_at, updated_at. Roles: admin, coordinator, provider_manager, specialist, patient, user (legacy → patient).
- **Guards:** requireAdmin(), requireCoordinator(), requireProviderManager(), requireSpecialist(), requirePatient(), getCurrentProfile(). Used in Server Components and API routes.
- **Login:** `/login` (and `/signin`, `/admin/login` → redirect); after sign-in, client calls `/api/auth/me` and redirects by role.

### 1.7 Stripe integration

- **Checkout:** POST `/api/stripe/checkout` (admin only): body lead_id, amount_cents, optional success_url/cancel_url; creates Payment + Stripe Checkout Session with metadata lead_id; returns URL for redirect.
- **Webhook:** POST `/api/stripe/webhook`: raw body + `Stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)`; on checkout.session.completed and payment_status=paid, updates payment by stripe_checkout_session_id (idempotent). No payment/card data logged.

### 1.8 Supabase usage

- **Auth:** Sign-in, session, getCurrentUser / getCurrentProfile.
- **Postgres:** All server reads/writes via getServerSupabase() (service role). RLS for defense in depth; app enforces role scoping.
- **Storage:** Admin assets upload/delete (referenced in admin assets routes).

### 1.9 Environment variables

- **Required (app):** SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
- **Optional:** DATABASE_URL (migrations/seeds), OPENAI_API_KEY, OPENAI_MODEL, NEXT_PUBLIC_WHATSAPP_NUMBER.
- **Config:** lib/config/server.ts validates server-side vars (Zod); no NEXT_PUBLIC_ in server schema. See docs/ENV_Y_STRIPE.md.

### 1.10 CI/CD configuration

- **In-repo:** No `.github/workflows` found. Verification is local: `npm run verify` (lint + test + build) and `./scripts/deploy_verify.sh <URL>` for deploy smoke.
- **Deploy:** Assumed Vercel (Git integration); deploy on push. Env set in Vercel dashboard.

### 1.11 Deployment strategy

- **Platform:** Vercel. Build: `next build --webpack`. Env from Vercel project settings.
- **Post-deploy:** Run deploy_verify.sh against deployment URL; optionally run migrations (Supabase linked or DATABASE_URL); Stripe webhook URL must point to production.

### 1.12 Testing coverage

- **Unit/integration:** Vitest; 32 tests across 8 files (health, leads, assessment, curated-network validation, admin-api validation, providers-api, auth-role, ai-schemas). No E2E in repo.
- **Critical paths covered:** GET /api/health, POST /api/leads (success, validation, honeypot), admin 403 when requireAdmin fails, auth/me 401/200, role redirect helpers.

### 1.13 Security controls

- **Admin/API:** All `/api/admin/*` and Stripe checkout require requireAdmin(); webhook validated by Stripe signature.
- **Secrets:** Service role and Stripe secret only in server env; not exposed to client.
- **RLS:** Enabled on main tables; is_admin() and role helpers; app layer enforces provider/specialist/email scoping for dashboards.
- **Input:** Zod on leads, checkout body, webhook metadata; request_id on error responses.

---

## 2. Current system map

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Frontend (Next.js App Router)                                            │
│   Landing (/), Assessment (/assessment), Packages, Login (/login)        │
│   Admin (/admin/*), Provider (/provider), Specialist (/specialist),      │
│   Coordinator (/coordinator), Patient (/patient)                         │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Backend (Route Handlers + Server Components)                             │
│   /api/health, /api/leads, /api/auth/me, /api/stripe/checkout|webhook    │
│   /api/admin/* (CRUD + AI). lib/auth guards, lib/* domain + validation  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Database      │     │ Payments        │     │ Auth             │
│ Supabase      │     │ Stripe          │     │ Supabase Auth    │
│ Postgres+RLS  │     │ Checkout +      │     │ Cookies +        │
│ Migrations    │     │ Webhook         │     │ profiles.role    │
└───────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────────────┐
│ Admin                                                                     │
│   requireAdmin() → overview, leads, providers, specialists, experiences,   │
│   bookings, consultations, assets; Collect deposit → Stripe checkout      │
└─────────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────────────┐
│ Automation                                                                 │
│   AI agents (triage, respond, itinerary, ops) in admin/leads/[id];      │
│   OpenAI optional (OPENAI_API_KEY); persisted in lead_ai                │
└─────────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────────────┐
│ Infrastructure                                                             │
│   Vercel (hosting, env). Supabase (DB, Auth, Storage). Stripe (payments) │
│   No GitHub Actions in repo; verify + deploy_verify scripts locally      │
└─────────────────────────────────────────────────────────────────────────┘
```

**How pieces connect:** User hits Next.js; public pages and role dashboards render with server data. Lead submit → POST /api/leads → Supabase. Admin creates checkout → POST /api/stripe/checkout → Stripe session; customer pays → Stripe sends webhook → POST /api/stripe/webhook → Supabase payment updated. Auth: login → Supabase Auth; /api/auth/me reads profile → role redirect. All privileged actions go through admin or role guards and server Supabase client.

---

## 3. Feature status

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | **Complete** | Hero, trust, packages, FAQ; design system in place |
| Assessment form | **Complete** | Honeypot, package prefill, travel_companions, budget_range, selected_experience_ids; POST /api/leads |
| Lead capture | **Complete** | Leads + booking row; rate limit; validation |
| Admin dashboard | **Complete** | Overview KPIs, leads, providers, specialists, experiences, bookings, consultations, assets; requireAdmin |
| Stripe checkout | **Complete** | Admin-only POST; creates payment + session; metadata lead_id |
| Stripe webhook | **Complete** | Signature verification, raw body, idempotent payment update |
| Supabase data layer | **Complete** | lib/* for providers, packages, specialists, experiences, consultations, bookings; RLS + service role |
| AI agents | **Complete** | Triage, respond, itinerary, ops; persisted in lead_ai; UI in lead detail |
| Package system | **Complete** | CRUD, published filter, package_experiences, package_specialists |
| Specialists | **Complete** | CRUD, approval_status, published; linked to provider |
| Experiences | **Complete** | CRUD, published, categories |
| Marketplace model | **Complete** | Curated network; approval workflow; no public provider/specialist signup |
| Authentication | **Complete** | Login, role-aware redirect, guards (admin, coordinator, provider_manager, specialist, patient) |
| Role system | **Complete** | profiles.role, provider_id, specialist_id; migration 0011 |
| Dashboards by role | **Complete** | /admin, /provider, /specialist, /coordinator, /patient with role-scoped data |

---

## 4. Security review

| Control | Status | Notes |
|---------|--------|-------|
| Stripe webhook signature | **OK** | Raw body + `constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)`; 400 on invalid |
| service_role usage | **OK** | Server-only; getServerSupabase() in API and Server Components only |
| RLS policies | **OK** | Enabled; is_admin() and role helpers; app enforces scoping |
| Admin route protection | **OK** | requireAdmin() on all admin pages and /api/admin/* and /api/stripe/checkout |
| Environment variable exposure | **OK** | No server secrets in NEXT_PUBLIC_*; documented in ENV_Y_STRIPE |
| API protection | **OK** | Public: leads POST, health, status; rest auth or signature |

**Risks:**

1. **No rate limit on /api/auth/me** — Low; returns only role/redirectPath.
2. **Stripe webhook** — Must use raw body in Next.js (no JSON parse before verify); current code uses `request.text()` and then constructEvent; confirm route is not parsing JSON globally.
3. **Coordinator/Provider/Specialist users** — Created manually (Supabase Dashboard or future invite); no self-service; acceptable for curated model.
4. **CI not in repo** — Reliance on local verify and manual deploy; adding GitHub Actions (lint/test on PR, optional deploy) would improve safety.

---

## 5. Launch readiness

**Score: 78%**

### Ready

- Core product: landing, assessment, lead capture, admin, Stripe checkout + webhook, role-based auth and dashboards.
- Data model and migrations 0001–0011; curated network and enterprise fields.
- Security: webhook verification, admin protection, RLS, no secret leakage.
- Verify (lint + test + build) passes; deploy_verify script for post-deploy check.
- Docs: ENV, Stripe, auth, roles, data model, security, engineering handbook.

### Must finish before launch

1. **Stripe webhook in production** — Configure endpoint for production URL; set STRIPE_WEBHOOK_SECRET in Vercel; send test webhook and confirm 200.
2. **End-to-end flow once** — Assessment → thank-you → admin → Collect deposit → Stripe test card (4242) → success; confirm payment and lead status in Supabase.
3. **At least one admin user** — Supabase Auth + profiles.role = 'admin' (documented in PRIMER_ADMIN).
4. **Migrations 0010 + 0011** applied on production Supabase (if not already).

### Can wait until after launch

- Invite flow for coordinator/provider/specialist (manual creation is OK at first).
- E2E tests (Playwright); Sentry; custom domain; advanced RLS policies for role-based DB access.
- Patient self-signup (optional); matching by email is enough for “my journey” dashboard.

---

## 6. Infrastructure review

| Component | Current state | Recommendation |
|-----------|---------------|-----------------|
| **Vercel** | Assumed primary host; env in dashboard | Keep; add production URL and (if needed) preview env for staging. |
| **Supabase** | One project; migrations via CLI or SQL Editor | Keep; ensure prod project has 0010+0011; document DATABASE_URL for migrations. |
| **Stripe** | Checkout + webhook; test/live keys | Add production webhook endpoint; use same STRIPE_WEBHOOK_SECRET per environment. |
| **CI pipeline** | None in repo; local `npm run verify` | Add GitHub Actions: on PR run lint + test (+ build optional) to protect main. |
| **Git workflow** | Not specified | Recommend: main = production; feature branches; verify before merge. |

---

## 7. Next 5 sprints

### Sprint 1 — Launch gate (1 week)

- **Goal:** Production launch ready; first deposit flow verified.
- **Tasks:** (1) Apply 0010+0011 on prod Supabase if needed. (2) Configure Stripe webhook for production URL; set STRIPE_WEBHOOK_SECRET in Vercel; redeploy. (3) Run E2E manually: assessment → lead → admin → Collect deposit → Stripe 4242 → confirm payment/lead in DB. (4) Ensure at least one admin exists; document production URL in README/STATUS.
- **Files:** README, STATUS, docs/DEPLOY_CHECKLIST, docs/CHECKLIST_PRIMERA_VENTA, docs/NEXT_TASKS (mark L1).
- **Outcome:** Deploy ✅; first sale checklist done; team can start selling.

### Sprint 2 — Observability and stability (1 week)

- **Goal:** Visibility into errors and uptime; safer deploys.
- **Tasks:** (1) Add Sentry (or similar) for API and client errors. (2) Add GitHub Actions: on push to main run lint + test (and optionally build). (3) Document runbook: how to check health, logs, Stripe dashboard.
- **Files:** New: Sentry config, .github/workflows/ci.yml; docs (runbook).
- **Outcome:** Errors tracked; CI on main; clear ops steps.

### Sprint 3 — Revenue and conversion (1–2 weeks)

- **Goal:** Increase conversion from lead to deposit.
- **Tasks:** (1) Review thank-you page: clear CTA (e.g. “We’ll contact you” + WhatsApp). (2) Optional: email confirmation on lead submit (e.g. Resend) so lead gets immediate feedback. (3) Admin: “Send deposit link” copy or one-click flow to reduce friction.
- **Files:** app/thank-you/page.tsx, app/admin/leads/[id] (copy/buttons), optional email lib.
- **Outcome:** Higher lead→deposit conversion; fewer drop-offs.

### Sprint 4 — Invite and roles in use (1–2 weeks)

- **Goal:** Coordinators and (optionally) provider managers can log in and use dashboards.
- **Tasks:** (1) Create 1–2 test users in Supabase (Auth + profiles with role coordinator/provider_manager and provider_id). (2) Document “how to add a coordinator” (manual steps or short script). (3) Optional: simple invite-by-email (magic link or temp password) that creates user + profile with admin-chosen role.
- **Files:** docs (invite runbook), optional app/api/admin/invite or similar.
- **Outcome:** Non-admin roles usable; path to scale operations.

### Sprint 5 — Polish and scale prep (1–2 weeks)

- **Goal:** Better UX and readiness for more traffic.
- **Tasks:** (1) Meta tags and Open Graph on landing and key pages. (2) Optional: E2E test (Playwright) for assessment → thank-you. (3) Optional: custom domain in Vercel. (4) Review RLS for coordinator/provider/specialist if they get direct DB access later.
- **Files:** app/layout or page metadata, tests/e2e (optional), Vercel config.
- **Outcome:** Sharable links, optional E2E safety net, domain ready.

---

## 8. How ChatGPT should help

**Cursor** = codebase and infrastructure (this repo, APIs, DB, auth, Stripe, tests, deploy scripts).  
**ChatGPT** = architecture, product, UX, prompts, and strategy without touching the repo.

Use ChatGPT for:

1. **Architecture design** — “How should we structure invite flows for coordinators without adding public signup?”
2. **UX improvements** — “What should the thank-you page say to maximize follow-up and deposit conversion?”
3. **Prompt engineering** — “Draft system prompts for the lead triage and reply AI so responses are on-brand and safe.”
4. **Marketplace strategy** — “Pricing and packaging for medical tourism: deposit vs full payment, refund policy wording.”
5. **Medical tourism product design** — “What information should we collect in the assessment to qualify leads for Colombia packages?”
6. **Landing conversion** — “Hero copy and CTA hierarchy for a curated medical tourism platform targeting US families.”

**Example questions for the founder to ask ChatGPT:**

- “Give me 3 variants of hero headline and subhead for a curated medical tourism platform (Colombia, family-oriented, trust-first).”
- “What are the top 5 objections patients have before booking medical tourism, and how should our landing page address them?”
- “Suggest a short email template we can send when a lead is created (confirmation + next steps).”
- “Design a simple scoring rubric for our AI lead triage: what makes a lead high/medium/low priority?”
- “What should our refund and cancellation policy say for deposits on medical packages (legal and trust)?“

---

## 9. Founder action plan

### This week

1. **Env and webhook** — In Vercel production: confirm all ENV_Y_STRIPE variables (Supabase + Stripe). Add Stripe webhook for production URL; set STRIPE_WEBHOOK_SECRET; redeploy.
2. **Database** — Ensure Supabase production has migrations 0001–0011 applied (`npm run db:migrate` with linked project or SQL Editor).
3. **Admin user** — Create one admin in Supabase Auth and set profiles.role = 'admin' (see PRIMER_ADMIN).
4. **One full flow** — Run: submit assessment → open admin → find lead → Collect deposit → pay with 4242 4242... → confirm redirect and that payment/lead status update in Supabase.
5. **Document** — Mark “Deploy” and “First sale” checklists; note production URL in README/STATUS.

### What to build next

- **Immediate:** Nothing blocking; platform is launch-ready after the above.
- **Next 2 weeks:** Sentry + CI (Sprint 2); thank-you and admin copy/flow (Sprint 3).
- **Next month:** Invite flow or manual runbook for coordinators (Sprint 4); meta tags and optional E2E (Sprint 5).

### What to test

- **Before launch:** One full E2E (assessment → deposit → DB check). Stripe “Send test webhook” for checkout.session.completed → 200.
- **After launch:** Real lead → real (small) deposit once in test mode; then switch to live when ready.

### What to deploy

- **Deploy:** Push to main (or your production branch); Vercel builds and deploys. Run `./scripts/deploy_verify.sh https://your-production-url.vercel.app` after deploy.
- **No code change needed for “launch”** — Only env, webhook, DB, and one verified flow.

**Founder goal:** Launch fast → test with real users → start selling packages. This audit says you can launch as soon as webhook + one E2E are done and one admin exists; then iterate with Sentry, CI, and conversion improvements in the next sprints.
