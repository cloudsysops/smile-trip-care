# Technical Work Plan — MedVoyage Smile

Date: 2026-03-15  
Scope: Architecture, debt audit, and phased roadmap for turning the current MVP into a production-grade SaaS foundation.

---

## A. Current architecture summary

### A1. Auth and session

- **Auth provider:** Supabase Auth (email/password + OAuth).
- **Browser client:** `lib/supabase/browser.ts`
  - Uses `createBrowserClient` from `@supabase/ssr`.
  - Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Stores session in cookies so the server can read it (SSR-compatible).
- **SSR auth client:** `lib/auth.ts`
  - `getAuthClient()` uses `createServerClient` from `@supabase/ssr` with `cookies()` from `next/headers`.
  - `getCurrentUser()` → calls `supabase.auth.getUser()` via SSR client.
  - `getCurrentProfile()` → uses service-role Supabase (`getServerSupabase()`) to read from `profiles` table, keyed by `user.id`.
  - `requireAdmin`, `requireCoordinator`, `requireProviderManager`, `requireSpecialist`, `requirePatient` wrap `getCurrentProfile()` with role checks.
- **Session refresh / edge interception:**
  - Root `proxy.ts` (Next.js 16 “proxy” convention) exports `proxy(request)` and delegates to `lib/supabase/middleware.updateSession(request)`.
  - `lib/supabase/middleware.ts`:
    - Uses `createServerClient` from `@supabase/ssr` with cookie bridge:
      - `getAll()` from `NextRequest.cookies`.
      - `setAll()` writes cookies onto `NextResponse`.
    - Calls `supabase.auth.getUser()` to refresh session and persist updated cookies.
    - Protects `/admin*` (redirects to `/admin/login` when unauthenticated).
    - Redirects authenticated users from `/login` to `/auth/callback` (so callback handles role-based redirect).
- **Callback route:** `app/auth/callback/route.ts`
  - When `?code=` is present:
    - Creates a **temporary** server Supabase auth client via `createServerClient` (`@supabase/ssr`) with a cookies bridge that:
      - Reads from `request.cookies`.
      - Captures `setAll()` calls into a local array.
    - Calls `supabase.auth.exchangeCodeForSession(code)`.
    - Writes any cookies captured from `setAll()` into the final `NextResponse` redirect.
  - When there is no `code`:
    - Falls back to `getCurrentUser()` from `lib/auth.ts` to read session from cookies (password login flow).
  - **Profile handling:**
    - Uses `getServerSupabase()` (service role) to select or insert a row in `profiles` with `role = 'patient'` if missing.
    - Rejects inactive profiles (`is_active = false`).
  - Redirects by role via `getRedirectPathForRole()` (admin → `/admin/overview`, patient/user → `/patient`, etc.).

### A2. Route handlers and role dashboards

- **API routes (non-exhaustive):**
  - `app/api/leads/route.ts` — Assessment submissions → creates leads (and bookings in newer migrations).
  - `app/api/signup/route.ts` — Creates `profiles` rows for newly signed-up patients.
  - `app/api/auth/me/route.ts` — Returns `{ role, redirectPath, email, full_name }` when authenticated; 401 otherwise.
  - `app/api/stripe/checkout/route.ts`, `app/api/stripe/webhook/route.ts` — Payments & webhook (idempotent, validated).
  - `app/api/admin/**` — Admin endpoints for leads, assets, providers, specialists, curated network, automation, outbound.
  - `app/api/automation/**`, `app/api/ai/**`, `app/api/health/**` — AI, workers, health & readiness.
- **Role dashboards (pages):**
  - **Public:** `/`, `/assessment`, `/assessment/proposal`, `/packages`, `/health-packages`, `/tour-experiences`, `/packages/[slug]`, `/thank-you`, `/legal`, `/login`, `/signup` (patient).
  - **Admin:** `/admin` (redirects to `/admin/overview`), `/admin/leads`, `/admin/leads/[id]`, `/admin/assets`, `/admin/providers`, `/admin/specialists`, `/admin/experiences`, `/admin/bookings`, `/admin/consultations`, `/admin/status`, etc.
  - **By role:** `/patient`, `/provider`, `/specialist`, `/coordinator` (all use `require*` functions from `lib/auth.ts` for guards).
  - **Patient dashboard:** `/patient` aggregates leads, bookings, consultations, payments, and progress (via `getPatientDashboardData` and `clinical/progress`).

### A3. Database structure (high level)

- See `docs/DATA_MODEL.md`, `STATUS.md`, and `supabase/migrations/**`:
  - **Core tables:**
    - `profiles` — User profile + `role` (`admin`, `patient`, `specialist`, `provider_manager`, etc.) + optional `provider_id`, `specialist_id`.
    - `packages` — Treatment packages (price, duration, location, provider linkage).
    - `leads` — Assessment submissions + status + attribution (`utm_*`, `landing_path`, `referrer_url`).
    - `payments` — Stripe deposit payments linked to leads/bookings with idempotency constraints.
    - `assets` — Approved/published media assets for landing and packages.
  - **Curated network / marketplace:**
    - `providers`, `specialists`, `experiences`, `package_experiences`, `package_specialists`, `consultations`, `bookings`.
    - `approval_status` fields and curated-network migrations (e.g. 0007–0010).
  - **Automation / AI / outbound:**
    - `lead_ai`, `ai_automation_jobs`, `outbound_messages`.
  - RLS helpers and functions:
    - `public.is_admin()` and policies implemented in `0001_init.sql` and subsequent migrations.

### A4. Current service/reuse state

- **Service-role DB client:** `getServerSupabase()` (singleton) used across libs and APIs.
- **Auth helpers:** `getCurrentUser`, `getCurrentProfile`, `require*` are centralized in `lib/auth.ts`.
- **Domain aggregation:** e.g. `lib/dashboard-data.ts` composes data for dashboards (patient, admin).
- **Business logic location (today):**
  - Many API routes contain validation + DB + response logic inline (e.g. `/api/leads`, `/api/signup`, `/api/stripe/checkout`, `/api/automation/**`).
  - Some cross-cutting logic (e.g. attribution, AI triggers) is encapsulated but not consistently under a dedicated `services` layer.
- **UI reuse:**
  - There are shared dashboard components under `app/components/dashboard/*` and landing components under `app/components/landing/*`.
  - `app/components/ui/` exists but is not yet the canonical design system for buttons, cards, etc.

---

## B. Technical debt audit

### B1. Business logic inside routes/pages

- **API routes**:
  - `/api/leads`, `/api/signup`, `/api/stripe/checkout`, `/api/automation/*`, `/api/admin/*` mix:
    - input validation (Zod),
    - DB access (via `getServerSupabase()`),
    - domain logic (e.g. lead status transitions, booking creation, AI job enqueues),
    - and HTTP response shaping.
  - This makes it harder to:
    - reuse logic from other contexts,
    - test in isolation,
    - migrate to workers/background jobs or queue processors.
- **Pages / route handlers**:
  - `/patient` and some admin pages compute significant domain logic directly in the page (e.g. summarizing leads/bookings/consultations and computing “current step”).

### B2. Missing / inconsistent service layer

- There is no canonical `lib/services/*` folder yet.
- Some de facto services exist (e.g. `dashboard-data`, `clinical/progress`), but:
  - naming is inconsistent,
  - API routes call directly into `getServerSupabase()` instead of a reusable service method.
- Consequences:
  - Harder to enforce invariants (e.g. how a lead transitions through statuses).
  - Difficult to manage side-effects (AI jobs, outbound messages, analytics) in a single place.

### B3. Repeated UI patterns

- Common patterns:
  - Cards with borders, headers, and metric stats (landing, admin overview, patient dashboard).
  - Buttons and CTAs (assessment, deposit, admin actions).
  - Panels for lists (leads, assets, outbound messages).
- These are implemented with slightly different Tailwind class combinations across the app instead of via a small set of `ui` primitives:
  - `Card`, `CardHeader`, `CardBody`, `CardTitle`, `Section`, `Badge`, `Tag`, `Metric`.

### B4. Missing diagnostics / observability gaps

- Strengths:
  - Good structured logging for:
    - `/api/leads`, `/api/auth/me`, `/auth/callback`, automation workers, outbound workers, health endpoints.
  - Dedicated scripts for verify and deploy smoke.
- Gaps:
  - No dedicated `/debug` endpoints (read-only) for:
    - auth/session inspection,
    - environment sanity (Supabase URL/host, mode, feature toggles).
  - No central error tracking (e.g. Sentry) yet (not Phase A, but noted).

### B5. Fragile auth/session points

- Historically fragile points (now mostly fixed but important to track):
  - Browser client using `createClient` (localStorage) instead of `createBrowserClient` (cookies).
  - Misaligned Supabase Site URL / Redirect URLs causing cookies not to reach the QA host.
  - Proxy not running in certain deployments (`middleware.ts` vs `proxy.ts` confusion).
- Today:
  - Wiring is correct (`createBrowserClient` + `createServerClient` + proxy), but failures can still occur when:
    - env vars differ between environments,
    - Supabase URL config diverges between local/QA/prod,
    - cookies are stripped or domain-scoped incorrectly.

### B6. Migration and deployment risk areas

- **Migrations:**
  - Many migrations (0001–0018+) with evolving marketplace/curated network and AI queues.
  - Risk: QA/prod Supabase projects missing a migration or having manual schema drift (e.g. missing `landing_path` previously caused PGRST204).
- **Deployment:**
  - Next.js + Tailwind v4 + SSR + proxy + Supabase SSR means:
    - Type errors (e.g. wrong import from `@supabase/ssr`) will break `next build` and silently keep an older deploy.
    - Proxy/middleware changes can cause subtle runtime differences between local and Vercel.

---

## C. Phased roadmap — Technical work plan

### Phase A — Safe UI/system foundation (CURRENT SPRINT)

- **Objective:**
  - Establish a global dark theme and theme system.
  - Add an auth diagnostics page.
  - Do a light security sanity check on auth/session.
- **Scope:**
  - Tailwind dark mode using class strategy (`.dark`).
  - `ThemeProvider` + `ThemeToggle` with `localStorage` persistence (default dark).
  - Apply dark theme to key pages: `/`, `/login`, `/signup`, `/assessment`, `/patient`, `/admin`.
  - Add `/debug/auth` (read-only, safe, limited for non-admins).
  - Security review of `proxy.ts`, `lib/auth.ts`, `app/auth/callback/route.ts`, `app/api/auth/me/route.ts`.
- **Risk:** Low–moderate (UI + small diagnostics). Backwards compatible if we avoid layout-breaking changes.
- **Affected files/folders:**
  - `app/layout.tsx`, `app/globals.css`, `app/components/ThemeProvider.tsx`, `app/components/ui/ThemeToggle.tsx`.
  - Key pages: `app/page.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`, `app/patient/page.tsx`, `app/assessment/**`, `app/admin/**`.
  - New route: `app/debug/auth/page.tsx`.
- **Dependencies:** Current auth/session must remain stable.
- **Estimated complexity:** 1–2 days.

### Phase B — Service layer extraction

- **Objective:**
  - Introduce a thin, clear service layer for core domains without breaking existing APIs.
- **Scope:**
  - Create `lib/services/assessment.service.ts`:
    - Functions like `createLeadFromAssessment`, `enrichLeadWithAttribution`, `enqueueAssessmentAutomations`.
  - Create `lib/services/profile.service.ts`:
    - Functions like `ensurePatientProfileForUser`, `getOrCreatePatientProfile`.
  - Refactor only a small set of APIs to use services:
    - `/api/leads` → uses `assessment.service`.
    - `/api/signup` → uses `profile.service`.
  - Keep function signatures and response contracts identical to avoid breaking tests.
- **Risk:** Moderate (touches core write paths but in a controlled way).
- **Affected files/folders:**
  - New: `lib/services/assessment.service.ts`, `lib/services/profile.service.ts`.
  - Existing: `app/api/leads/route.ts`, `app/api/signup/route.ts`, possibly `lib/dashboard-data.ts`.
- **Dependencies:** Phase A done and stable; DB schema already supports current logic.
- **Estimated complexity:** 2–3 days.

### Phase C — Patient pipeline / journey model

- **Objective:**
  - Add a structured `patient_pipeline` model to track journey stages across the platform.
- **Scope:**
  - New migration: `patient_pipeline` table with `patient_id`, `assessment_id`, `stage`, `notes`, timestamps.
  - No behavioral changes in Phase C. Wire-up events only in later phases.
  - Add minimal service helpers in `lib/services/patient-pipeline.service.ts` (insert/update stage).
- **Risk:** Moderate (schema expansion; low runtime risk if not yet hooked into flows).
- **Affected files/folders:**
  - `supabase/migrations/00xx_patient_pipeline.sql`.
  - `lib/services/patient-pipeline.service.ts` (optional skeleton).
- **Dependencies:** Migrations pipeline stable; leads/profiles/consultations/bookings in place.
- **Estimated complexity:** 1–2 days (migration + docs).

### Phase D — Dashboard/admin evolution

- **Objective:**
  - Evolve patient and admin dashboards into rich SaaS panels.
- **Scope:**
  - `/patient`:
    - Add journey timeline using leads/bookings/consultations/progress.
    - Payment status component (from `payments`/bookings).
    - Upcoming consultations widget.
    - Travel checklist (static or template-based).
  - `/admin/overview`:
    - Assessment review queue.
    - Pipeline summary (once `patient_pipeline` is populated).
    - Payment tracking summary.
  - Refactor heavy logic into `lib/services/patient.service.ts`, `lib/services/admin-dashboard.service.ts` where appropriate.
- **Risk:** Moderate (front+back; must preserve existing admin flows).
- **Affected files/folders:**
  - `app/patient/page.tsx`, `app/admin/overview/page.tsx`, `lib/dashboard-data.ts`, `lib/services/*`.
- **Dependencies:** Phases A–C; especially `patient_pipeline` if used.
- **Estimated complexity:** 3–5 days.

### Phase E — Growth / automation / AI expansion

- **Objective:**
  - Build on the existing AI and outbound foundations for growth and operations.
- **Scope:**
  - Improve outbound command center UX and metrics.
  - Add growth dashboards (e.g. attribution analytics, conversion funnels).
  - Extend AI agents with better prompts and guardrails (no schema changes).
- **Risk:** Moderate (business impact but relies on stable core flows).
- **Affected files/folders:**
  - `app/admin/outbound/**`, `app/api/ai/**`, `lib/ai/**`, `lib/services/*`.
- **Dependencies:** Stable production flows; observability in place.
- **Estimated complexity:** 1–2 weeks incremental.

### Phase F — Observability / security hardening

- **Objective:**
  - Add production-grade observability and strengthen security guarantees.
- **Scope:**
  - Add Sentry (or similar) for API + client error tracking.
  - Add structured tracing for critical flows (leads, payments, auth).
  - Review and tighten RLS policies for prod.
  - Add more `/debug/*` diagnostics where safe, plus rate-limits on auth and admin APIs if needed.
- **Risk:** Moderate (changes around auth/webhook and RLS; must be staged).
- **Affected files/folders:**
  - `app/api/**`, `lib/logger`, Supabase RLS policies, Vercel config.
- **Dependencies:** Core flows must already work in production; tests and verify pipeline robust.
- **Estimated complexity:** 1–2 weeks.

---

## D. Do now / do later / do not touch yet

| Bucket | Items |
|--------|-------|
| **Do now (Phase A)** | Implement dark theme foundation (ThemeProvider, ThemeToggle, global palette) and apply to key pages (`/`, `/login`, `/signup`, `/assessment`, `/patient`, `/admin`). Add `/debug/auth`. Perform light auth/session security sanity check. |
| **Do later (near-term)** | Phase B service layer for assessment/profile; Phase C `patient_pipeline` schema; Phase D dashboard evolution. Small observability improvements (e.g. `/debug` pages) alongside. |
| **Defer (after production stable)** | Full growth/AI expansion (Phase E), deeper observability and security hardening (Phase F) including Sentry, advanced rate limiting, complex RLS refactors. |
| **Avoid for now** | Any Stripe or webhook rewrites; replacing Supabase Auth; large-scale route restructuring; invasive refactors of working admin/automation/payment flows; introducing new infra (Kafka, separate services, etc.) before the SaaS core is proven. |

