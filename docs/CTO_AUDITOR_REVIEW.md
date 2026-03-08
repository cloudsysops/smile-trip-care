# CTO Auditor Review — Nebula Smile

**Role:** CTO Auditor (review only; no code implementation).  
**Focus:** Architecture, security, auth, payments, RLS, API structure, deployment, maintainability.  
**Classification of changes:** SAFE | MODERATE | RISKY (with safer alternatives when risky).

---

## 1. Architecture Audit

### 1.1 What is solid

- **Single service-role entry point:** `getServerSupabase()` in `lib/supabase/server.ts` is the only place that creates a Supabase client with the service role key. It throws if config is missing. No service role key is exposed via `NEXT_PUBLIC_*` or client bundles.
- **Browser vs server split:** Client uses `getBrowserSupabase()` (anon key only, RLS applies). Auth in Route Handlers/Server Components uses `createServerClient` with anon key and cookies. Writes and admin reads use server client only.
- **API structure:** Admin APIs live under `/api/admin/*`; each handler calls `requireAdmin()` (or the appropriate `require*`) at the start. Stripe and auth routes are clearly separated. No mixed public/admin logic in a single route.
- **Payment flow:** Checkout amount is resolved server-side from package pricing; client `amount_cents` is ignored and only logged. Redirect URLs are validated same-origin. Webhook uses raw body and signature verification; idempotent handling for duplicate events.
- **Validation:** Zod used at API boundaries (leads, checkout body, webhook metadata). Reduces malformed data and injection surface.

### 1.2 Concerns

- **Singleton server client:** `lib/supabase/server.ts` caches one `SupabaseClient` in a module-level variable. In serverless (Vercel), instances are per invocation/cold start, so this is acceptable. If the app ever runs long-lived Node processes, consider per-request clients to avoid connection or context bleed (low priority for current deploy).
- **Dashboard data bypasses RLS:** `lib/dashboard-data.ts` and role-scoped helpers use `getServerSupabase()` and filter in application code (email, provider_id, specialist_id). RLS is effectively bypassed for these reads. **Risk:** If a future change adds a client call path to the same data without going through these helpers, RLS would still restrict anon; but any new server route that reads “all leads” or “all payments” without a guard would be a serious bug. **Mitigation:** Keep a single data-access layer for dashboards; any new route that reads leads/payments/bookings must use the same helpers or explicit `require*` + scope.
- **Automation/outbound workers:** Worker endpoints use a shared secret (header or Bearer). If the secret is weak or leaked, anyone can trigger job execution. **Current state:** Documented; secret not in repo. **Recommendation:** Ensure `AUTOMATION_CRON_SECRET` / `CRON_SECRET` are strong and rotated if compromised; consider IP allowlist for Vercel cron if available.

---

## 2. Security and Auth Safety

### 2.1 Strengths

- **Auth is server-centric:** Role is read from `profiles` via `getCurrentProfile()`; `requireAdmin()` and other `require*()` run on the server and throw on failure. No client-only role checks used for access control.
- **Inactive users:** `getCurrentProfile()` returns `null` if `profile.is_active` is false; inactive users cannot access protected routes that use it.
- **Patient scope:** Checkout restricts patients to leads where `lead.email` matches `profile.email` (case-insensitive). Enforced in the same handler that creates the session.
- **Login/signup:** Login uses Supabase `signInWithPassword`; signup creates a profile with `role = 'patient'` only. No public path to create admin/coordinator/provider/specialist.

### 2.2 Risks and recommendations

| Risk | Severity | Recommendation |
|------|----------|----------------|
| **No rate limit on signup/login** | Medium | Add rate limiting (e.g. per IP) on POST `/api/signup` and on the login path (or a thin API used by the login form). Prevents signup spam and brute-force. |
| **Email confirmation** | Low | If Supabase is set to require email confirmation, POST `/api/signup` may run before the session exists. Document the flow (“Confirm your email, then sign in”) or handle “pending confirmation” in the UI. |
| **Middleware only for /admin** | Low | `/provider`, `/specialist`, `/coordinator`, `/patient` are protected only in the page (require* → redirect). An attacker could trigger server work before redirect. Prefer adding these paths to middleware so unauthenticated requests are redirected without running page logic. |
| **SECURITY.md placeholder** | Low | Replace “indicar email de contacto” with a real security contact before launch. |

---

## 3. Payment Safety

### 3.1 What is safe

- **Checkout:** Amount comes from `packages.deposit_cents` (or fallback). Client cannot override the charged amount. Lead must exist; patient must own the lead (email match). Payment row is created before redirect to Stripe.
- **Webhook:** Raw body used for signature verification. Only `checkout.session.completed` with `payment_status === "paid"` and `mode === "payment"` updates state. Metadata `lead_id` validated with Zod. Duplicate sessions handled (existing row or unique violation); lead/booking updates are conditional to avoid double application.
- **No card data:** Card data is never stored or logged; Stripe handles PCI.
- **Idempotency:** Unique constraint on `stripe_checkout_session_id` (or equivalent) and conditional updates prevent duplicate payment/status updates on webhook replay.

### 3.2 Gaps

- **Webhook event not persisted:** Table `stripe_webhook_events` exists and is read in admin metrics, but the webhook handler does not insert into it. **Impact:** Harder to audit and debug webhook delivery/failures. **Recommendation:** In the webhook handler, after signature verification, insert a row (event_id, type, status, received_at) and optionally update status to `processed`/`failed` after processing. Classify this change as **MODERATE** (touches payment-related code path).

---

## 4. Supabase RLS

### 4.1 Current state

- RLS is enabled on core tables (profiles, packages, leads, payments, assets, itineraries, lead_ai, and related tables per migrations).
- Policies use `is_admin()` (backed by `profiles.role = 'admin'`) for admin-only tables. Profiles: own read/update; admin all.
- **Service role bypasses RLS.** All server-side writes and most admin/dashboard reads use `getServerSupabase()`, so RLS does not apply to those operations. Scoping is done in application code (e.g. dashboard-data by email, provider_id, specialist_id).

### 4.2 Auditor view

- **Acceptable for launch:** The app does not expose a generic “Supabase client” to the client; the client uses the anon key and would be subject to RLS for any direct Supabase calls. In practice, sensitive writes (leads, payments, profile creation) are done only in Route Handlers with service role and explicit validation. So RLS acts as a safety net for any future direct client access to Supabase, while the main enforcement is in the API layer.
- **Risk:** If someone later adds a Server Action or API that uses the **anon** client (or a client that passes user JWT) to modify leads/payments without proper checks, RLS would block it (good). If they use the **service role** by mistake, RLS would not block it (bad). **Recommendation:** Keep a clear rule: “Sensitive tables (leads, payments, profiles, etc.) are written only from Route Handlers that call requireAdmin or explicit scope checks and use getServerSupabase().” Document this in the engineering handbook or DATA_MODEL.

---

## 5. API Structure

### 5.1 Good patterns

- **Consistent guard pattern:** Admin routes use `await requireAdmin()` at the top; checkout uses `getCurrentProfile()` then role and email checks. Same pattern across admin APIs.
- **Errors:** 401 for missing auth, 403 for wrong role, 400 for validation, 404 for missing resource. No stack traces or internals in JSON responses.
- **Request IDs:** Checkout and webhook (and likely others) attach a `request_id` for logging; helps trace production issues.
- **Health:** `/api/health` and `/api/health/ready` are public and do not expose secrets; ready can check DB/config.

### 5.2 Suggestions

- **Leads API:** Public POST is correct for the form. Ensure rate limit and honeypot remain in place; any change that makes lead creation possible without honeypot or rate limit is **RISKY**.
- **Worker endpoints:** Automation and outbound workers are protected by a shared secret. Do not add these to public docs or client-side code. Any change that makes the secret optional or weak is **RISKY**.

---

## 6. Deployment Safety

- **Secrets:** Not in repo; env vars documented in `.env.example`; CI validates env shape with placeholders. Good.
- **Build:** `npm run verify` (lint + test + build) passes. No known build-time exposure of server secrets (service role is only in server config).
- **Migrations:** Ordered (0001–0020); applied via script or SQL Editor. No destructive changes in the listed migrations. **Rule:** Any new migration that drops columns or tables used in production should be **RISKY** until reviewed for data loss and rollback.
- **Webhook URL:** Must be set in Stripe to the production base URL + `/api/stripe/webhook`. Redeploy after adding `STRIPE_WEBHOOK_SECRET` so the runtime has it.

---

## 7. Maintainability

- **Single place for auth helpers:** `lib/auth.ts` centralizes getCurrentProfile, requireAdmin, requirePatient, etc. New protected routes should reuse these.
- **Single place for server DB:** `getServerSupabase()` is the only server Supabase client for writes and admin reads. Keeps “who can do what” predictable.
- **Validation in one layer:** Zod schemas in `lib/validation/` and reused at API boundaries. Changing a field (e.g. lead) should be done in the schema and then call sites.
- **Docs:** Many docs (AUTH_AND_ROLES, DASHBOARD_ROLES, DATA_MODEL, DEPLOY_CHECKLIST, TEST_FIRST_SALE). Keep DEPLOY_CHECKLIST and TEST_FIRST_SALE updated when the flow changes.

---

## 8. Change Classification Framework

Use this when reviewing **proposed** changes (by CTO Builder or others).

### SAFE

- **Definition:** Low risk; no auth, payment, or RLS logic changed; no new endpoints that touch PII or payments.
- **Examples:** UI copy/styling, adding a non-sensitive doc, adding a test for existing behavior, refactoring internal helpers without changing API contract, updating README/STATUS.
- **Process:** Can be implemented and merged with normal PR review. Auditor does not need to block.

### MODERATE

- **Definition:** Touches auth, payments, or data access but in a contained way; or adds new endpoints that are properly guarded and validated.
- **Examples:** Adding rate limit to signup/login; persisting webhook events in the webhook handler; adding a new admin API that uses requireAdmin and existing data layer; adding middleware for /provider, /specialist, /coordinator, /patient; new migration that only adds columns or tables (no drop).
- **Process:** Implement with clear tests and docs; PR should call out the area (auth/payment/RLS). Auditor reviews for guard usage, validation, and scope. Approve if patterns match existing safe code.

### RISKY

- **Definition:** Could compromise security, payments, or data integrity; or change behavior of a critical path without clear rollback.
- **Examples:**
  - Changing webhook to skip signature verification or to trust client-provided amount.
  - Exposing service role or Stripe secret to the client or to a public route.
  - Adding a route that writes to leads/payments/profiles without requireAdmin or explicit patient scope (email match).
  - Removing or relaxing honeypot or rate limit on lead creation.
  - RLS policy change that broadens who can read/write leads or payments.
  - Migration that drops columns/tables or changes constraints in a way that can break running code or lose data.
  - Making automation/outbound worker endpoints callable without the shared secret.
- **Process:** **Do not implement without explicit approval.** Auditor should explain why it is risky and propose a **safer alternative** (e.g. “Use requireAdmin and existing getServerSupabase(); do not add a new client-callable path that writes payments.”). If the change is still needed, implement the safer alternative and re-review.

---

## 9. Summary Table

| Area | Verdict | Notes |
|------|---------|--------|
| **Architecture** | OK | Single service-role path; clear server vs client split. Dashboard bypass of RLS is by design; keep data layer centralized. |
| **Security** | OK | Auth and payment paths are server-guarded. Add rate limit on signup/login; fix SECURITY.md contact. |
| **Auth safety** | OK | require* and getCurrentProfile; no client-only trust. |
| **Payment safety** | OK | Server-side amount; webhook verified and idempotent. Add webhook event persistence for audit. |
| **Supabase RLS** | OK | RLS on; service role used only server-side with explicit scope in app. Document “no sensitive writes without guard + server client.” |
| **API structure** | OK | Consistent guards and validation. |
| **Deployment** | OK | Verify passes; secrets in env; migrations ordered. |
| **Maintainability** | OK | Centralized auth and server DB; validation layer clear. |

**Overall:** The platform is in a **production-ready** state from an auditor perspective, with the improvements above (rate limit on auth, webhook persistence, SECURITY.md, optional middleware for role routes) recommended but not launch blockers. Any **proposed change** should be classified with SAFE / MODERATE / RISKY using the framework above; risky changes must be replaced with a safer alternative or explicitly approved before implementation.

---

*CTO Auditor — review only; no code changes made.*
