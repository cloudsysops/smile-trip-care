# Enterprise Readiness Audit — MedVoyage Smile

**Date:** 2026-03-10  
**Scope:** Compliance/legal, testing, data consistency, auditability, security, scalability.  
**No code was modified; audit only.**

---

## A. Executive summary

MedVoyage Smile is a health-tech coordination platform (dental tourism, Colombia) with a solid technical base: role-based auth, Stripe checkout with server-side pricing and idempotent webhook, RLS, structured logging, and clear separation of admin vs patient flows. To operate as a **serious health-tech business** and support paid traffic, real patients, and enterprise/investor expectations, the main gaps are: **legal/compliance** (no formal ToS, privacy policy, refund/concierge disclaimers), **auditability** (no “who changed what” on leads), **patient data access pattern** (one dashboard query loads all payments then filters in memory), **E2E coverage** (Playwright exists but is excluded from CI and not a full critical-path suite), and **non-atomic business flows** (lead+booking, webhook payment+lead+booking). The platform is suitable for early growth and demos **after** addressing the highest-impact legal, data-access, and auditability items and tightening the critical path flows and tests.

---

## B. Current strengths

- **Auth and roles:** Server-side `requireAdmin()`, `requirePatient()`, `requireCoordinator()`, etc.; role from `profiles`; inactive users blocked. Patient signup creates only `patient` role; no public admin/coordinator/provider/specialist signup.
- **Payments:** Checkout amount from server (package deposit); client `amount_cents` ignored. Redirect URLs validated same-origin. Webhook: raw body, signature verification, `payment_status === "paid"`, idempotent handling and unique constraints.
- **Data model:** RLS on core tables; service role used only server-side; sensitive writes in Route Handlers with validation (Zod at API boundaries).
- **Security:** Secrets server-only; security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy); SECURITY_COMPLIANCE.md and AI policy (no medical advice, human-in-the-loop).
- **Structured logging:** Request-scoped logger with `request_id`; JSON to stdout/stderr; care not to log raw lead/patient content in errors.
- **Testing:** 69 unit/integration tests (Vitest) for leads API, Stripe checkout/webhook, health, auth, admin APIs, automation, outbound, payments reliability. Build and verify pipeline in place.

---

## C. Top legal/compliance risks

| Risk | Current state | Gap |
|------|----------------|-----|
| **Personal data** | Leads store first_name, last_name, email, phone, country, message, UTM, etc. Assessment and thank-you flow collect and persist this. | No explicit consent checkbox or “I agree to privacy policy” at submission; no documented retention or deletion policy. |
| **Medical-adjacent data** | Lead message and selected_specialties can describe treatment goals; plan (PLAN_SMART_INTAKE_WIZARD) mentions future “patient photos” in bucket `patient-photos`. | Today no clinical documents/photos in DB; once added, need clear classification (sensitive health data), access control, and retention. |
| **Terms of Service** | Not present. | Missing. Required for paid traffic and enterprise; should cover use of platform, acceptable use, limitation of liability. |
| **Privacy policy** | `/legal` has short “We use your contact details only to coordinate… We do not sell your data. For full privacy policy, contact us.” | No full, standalone privacy policy (data collected, purpose, retention, rights, cookies, third parties, international transfer if applicable). |
| **Intermediary / liability** | Landing FAQ has “Medical disclaimer”; thank-you and proposal use “orientation only; final treatment planning belongs to the specialist.” | No explicit intermediary liability disclaimer (we coordinate, we do not provide medical care; clinics are independent). |
| **Refund / cancellation** | FAQ says “deposit secures your spot” and “remainder typically due per clinic’s terms.” | No written refund policy or cancellation expectations for deposits (e.g. non-refundable vs conditions, chargebacks). |
| **Concierge scope** | Copy describes coordination, travel, logistics. | No clear “scope of concierge services” disclaimer (what is included vs excluded; no guarantee of outcomes). |

**Recommendation:** Add formal ToS, full privacy policy, intermediary and medical disclaimers, refund/cancellation policy, and concierge scope; obtain legal review before scaling paid acquisition.

---

## D. Top operational risks

| Risk | Detail |
|------|--------|
| **Lead + booking not atomic** | `POST /api/leads`: insert lead, then insert booking (if package selected). If booking insert fails, lead exists but booking does not; only `log.warn`. No transaction; possible inconsistent state. |
| **Webhook multi-step not atomic** | Webhook: create/update payment → update lead status → update booking status → enqueue jobs. If lead update succeeds and booking update fails, lead is `deposit_paid` but booking may still be `pending`; log.warn only. No DB transaction. |
| **Checkout session vs payment row** | Checkout creates Stripe session, then inserts `payments` row. If insert fails after session creation, user can pay but we may not have a payment row until webhook (webhook can create row from metadata). Acceptable but worth documenting; orphan sessions possible if webhook never arrives. |
| **Package recommendation override** | Admin PATCH lead can set `recommended_package_slug`; no audit of who changed it or when (only `updated_at`). |
| **Automation enqueue after lead** | Lead created → `enqueueLeadCreatedAutomationJobs` is fire-and-forget. If enqueue fails, lead exists but no triage/response jobs; logged but not retried automatically. |

**Recommendation:** Prefer DB transactions for lead+booking and for webhook (payment+lead+booking) where possible; add `updated_by` (and optionally audit log) for lead changes; consider retry or dead-letter for enqueue failures.

---

## E. Top testing/QA gaps

| Area | Current state | Gap |
|------|----------------|-----|
| **Unit/integration** | Vitest: 69 tests in `tests/**/*.test.ts`; coverage for leads, Stripe, health, auth, admin, automation, outbound, payments lib. | Good for API and logic; no React component or page-level tests. |
| **E2E / Playwright** | `e2e/patient-journey.spec.ts` exists: landing → assessment → proposal → login/signup → patient dashboard → deposit CTA. Uses `@playwright/test`. | Vitest config excludes `e2e/**`, so E2E not run in `npm run test` or `npm run verify`. Playwright must be run separately (`npm run test:e2e`). No CI integration of E2E in current setup. |
| **Critical path** | E2E file describes the right flow (landing → assessment → proposal → thank-you → login/signup → patient → deposit). | Not all steps may be stable (e.g. proposal requires valid lead_id; signup/login need test credentials); no evidence of full run in CI. |

**Proposed Playwright test plan (critical flow):**

1. **Landing:** Load `/`, hero and “Free Smile Evaluation” / “Get My Free Treatment Plan” visible, CTA links to `/assessment`.
2. **Assessment:** Load `/assessment`, form visible (first name, last name, email, submit). Submit with valid data → 201 + redirect to `/assessment/proposal?lead_id=...` or thank-you with `lead_id`.
3. **Proposal:** Load `/assessment/proposal?lead_id=<uuid>` (or from redirect). Heading “Your Personalized Smile Preview”, savings copy, WhatsApp link, recommended package when present.
4. **Thank-you:** Load thank-you with `lead_id` (+ optional `recommended_package_slug`). Confirmation message, next steps, link to package if any.
5. **Login:** Load `/login`, form visible; sign in with test credentials → redirect to `/patient` or `?next=` path.
6. **Signup:** Load `/signup`, form visible; create patient account (or skip if same as login flow).
7. **Patient dashboard:** As patient, load `/patient`. Profile section, journey/treatment section when lead has recommendation, “Pay deposit” CTA when applicable.
8. **Deposit path:** From patient dashboard, click deposit → POST `/api/stripe/checkout` → redirect to Stripe Checkout (mock or test mode); optional: webhook simulation and assert lead status `deposit_paid` (can be separate test or manual).

**Recommendation:** Run Playwright in CI (e.g. on deploy or nightly); use test env and seeded/test lead for proposal; document E2E credentials and env (E2E_TEST_EMAIL, E2E_TEST_PASSWORD, BASE_URL). Classify adding CI E2E as **MODERATE** (config only).

---

## F. Top security/access risks

| Risk | Detail |
|------|--------|
| **Patient dashboard payments query** | `getPatientDashboardData(email)` fetches **all** payments with `supabase.from("payments").select(...).order("created_at")` (no `lead_id` filter), then filters in memory by `leadIds` from leads matched by email. **Impact:** Server loads every payment row; if a bug ever removed the filter, or if another caller reused this without filtering, it would leak all payments. Also inefficient at scale. |
| **Storage** | Assets upload: admin-only, bucket `assets`; validation (file type, etc.). No `patient-photos` bucket yet (planned in Smart Intake plan). When added, must be private; signed URLs for admin only; no public list. |
| **Admin/coordinator access** | Admin sees all leads, payments, bookings; coordinator sees all leads/bookings/consultations (via getCoordinatorDashboardData). No per-admin or per-role audit of who viewed what. |
| **MFA** | Not implemented. Supabase supports MFA; no enforcement for admin or coordinator. High-privilege accounts are password-only. |
| **Backups** | No backup/restore procedure documented in repo. Supabase project may have point-in-time or daily backups (provider-dependent); not codified or verified here. |
| **Middleware scope** | Only `/admin` (except `/admin/login`) is protected in middleware; `/patient`, `/coordinator`, `/provider`, `/specialist` rely on page-level `require*()` + redirect. Unauthenticated request still runs server component until redirect. Low impact but increases surface. |

**Recommendation:** Fix patient payments query to filter by `lead_id` in DB (e.g. `.in("lead_id", leadIds)`); document storage and backup strategy; plan MFA for admin (and optionally coordinator); extend middleware to redirect unauthenticated users for `/patient`, `/coordinator`, `/provider`, `/specialist`.

---

## G. Top scalability risks

| Risk | Detail |
|------|--------|
| **Traffic spikes** | Next.js on Vercel; serverless. Lead creation is rate-limited (e.g. 10/min per IP). Stripe and Supabase are external; no in-app queue for lead submission. Under heavy load, DB or Stripe could become bottleneck; no circuit breaker or queue for submissions. |
| **Operational scaling** | Coordinator dashboard loads last 50 leads, 30 bookings, 30 consultations; admin lists not paginated everywhere. Fine for early stage; will need pagination and filters as volume grows. |
| **Supportability** | Single codebase; no feature flags or A/B framework documented. Logs are structured but not centralized (e.g. no Sentry/LogDrain mentioned in repo). Harder to debug production without log aggregation. |
| **Hiring / onboarding** | Docs (AUTH_AND_ROLES, DATA_MODEL, SECURITY_COMPLIANCE, CTO_AUDITOR_REVIEW) are strong. ENGINEERING_HANDBOOK and DEPLOY/CHECKLIST exist. New engineers need clear “where to change what” and “what not to change”; controlled-execution policy in .cursor helps. |

**Recommendation:** Keep current architecture for early growth; add pagination to admin/coordinator lists when needed; document backup and log aggregation for production; consider feature flags and error tracking (e.g. Sentry) for supportability.

---

## H. SAFE / MODERATE / SENSITIVE recommendations

| Recommendation | Classification | Rationale |
|----------------|----------------|-----------|
| Add ToS, privacy policy, refund policy, concierge/intermediary disclaimers (content + legal review) | **SENSITIVE** | Legal and business; no code change until content is approved. |
| Fix patient dashboard payments query to filter by `lead_id` in DB | **SAFE** | Logic fix; reduces leak risk and improves performance. |
| Add `updated_by` (and optional audit table) for lead PATCH | **MODERATE** | Schema + API change; enables “who changed lead.” |
| Use DB transaction for lead + booking creation | **MODERATE** | Touches critical path; test carefully. |
| Use DB transaction in webhook for payment + lead + booking updates | **MODERATE** | Touches payment path; test idempotency and failures. |
| Persist webhook events to `stripe_webhook_events` in handler | **MODERATE** | Payment-related; improves audit/debug. |
| Run Playwright E2E in CI | **MODERATE** | Config and env; no app logic. |
| Extend middleware to protect /patient, /coordinator, /provider, /specialist | **SAFE** | Redirect before page logic; low risk. |
| Document backup and log strategy | **SAFE** | Docs only. |
| Plan MFA for admin | **SENSITIVE** | Auth and ops; design before implementation. |

---

## I. 30-day hardening roadmap

- **Week 1 – Legal and compliance (content)**  
  - Draft ToS, full privacy policy, refund/cancellation, intermediary and concierge disclaimers.  
  - Add consent/privacy link at assessment submit (no logic change until policies are live).  
  - Legal review where required.

- **Week 2 – Data and audit**  
  - Fix patient dashboard payments query (filter by `lead_id` in DB).  
  - Add `updated_by` to lead updates (and optionally audit log table).  
  - Document backup and log strategy.

- **Week 3 – Critical path robustness**  
  - Introduce transaction for lead + booking creation (or explicit compensating logic and tests).  
  - In webhook, wrap payment + lead + booking updates in transaction where feasible; keep idempotency.  
  - Persist webhook events to `stripe_webhook_events` for audit.

- **Week 4 – QA and ops**  
  - Integrate Playwright E2E into CI (branch or deploy); document env and test credentials.  
  - Extend middleware to protect /patient, /coordinator, /provider, /specialist.  
  - One full manual run of critical path (landing → assessment → proposal → thank-you → login → patient → deposit) and document.

---

## J. What must be fixed before calling this a serious health-tech operation

1. **Legal/compliance:** Publish and link full **Terms of Service**, **Privacy Policy**, **refund/cancellation** expectations, and **intermediary/concierge scope** disclaimers; ensure assessment (and any future intake) has clear consent/links. Legal review recommended.
2. **Patient data access:** Fix **patient dashboard payments query** so it never loads all payments; filter by `lead_id` (or equivalent) in the database.
3. **Auditability:** Know **who** changed a lead (status, recommendation, notes) and **when** — at least `updated_by` on lead (or equivalent audit trail).
4. **Critical path consistency:** Make **lead + booking** creation and **webhook payment + lead + booking** updates **atomic** (transactions or well-defined compensating actions and tests).
5. **E2E and CI:** Treat the **critical user journey** (landing → assessment → proposal → thank-you → login/signup → patient → deposit) as a **tested path**: Playwright (or equivalent) run in CI and green before release.
6. **Operational readiness:** Document **backup/restore** and **log aggregation** for production; define who has access to Supabase/Stripe and under what conditions. Plan **MFA for admin** (and optionally coordinators).

Once these are in place, the platform is in a much stronger position to present itself as a serious health-tech operation for paid traffic, real patients, and enterprise/investor demos.
