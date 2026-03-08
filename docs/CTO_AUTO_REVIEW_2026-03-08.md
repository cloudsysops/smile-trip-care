# CTO Auto-Review — 2026-03-08

**Scope:** Post-merge state of `main` (commit `c3ae8a4`: integration of `production-hardening` + `origin/main`).  
**Current state:** No unmerged changes; `main` is in sync with `origin/main`.  
**Purpose:** Identify what was changed, risks, missing tests/docs, and merge/deploy safety.

---

## 1. Summary of changes

### 1.1 What was merged (conflict resolution + combined codebase)

| Area | Change |
|------|--------|
| **README / STATUS** | Combined env docs (Supabase, Stripe, AI vars), module table (M10–M19 + Marketplace, Curated network, Auth/roles), single “Run after migration” section. |
| **Leads API** | Merged: booking creation + specialist/experience/travel_companions/budget fields (production-hardening) with UTM/landing_path/referrer + `enqueueLeadCreatedAutomationJobs` (origin/main). |
| **Stripe checkout** | Kept explicit validation message; removed duplicate `const supabase` (build fix). |
| **Stripe webhook** | Combined: idempotent payment lookup/update (origin/main) + booking status update to `deposit_paid` (production-hardening) + `enqueueDepositPaidAutomationJobs`. Mode check + payment_status check retained. |
| **Landing** | Kept production-hardening version (`app/page.tsx`: hero, trust, packages, Medellín/Manizales, etc.). |
| **Admin / app** | Conflict resolution: accepted origin/main versions for AdminLeadsList, DepositButton, leads [id], assessment, packages/[slug], plus new automation/outbound from main. |
| **Docs / lib** | Accepted origin/main for DATA_MODEL, SECURITY_COMPLIANCE, VERCEL_DEPLOY, lib/ai (prompts, schemas), lib/validation/lead. |
| **Middleware** | `middleware.ts` deleted (production-hardening); `proxy.ts` kept (origin/main). |
| **Migrations** | Both branches’ migrations present: 0004–0011 from origin/main (attribution, follow-up, automation, outbound, payments idempotency) **and** 0006–0011 from production-hardening (specialists, marketplace, curated network, profiles/roles). **Naming conflict:** three files with prefix `0009_` (see Risks). |
| **Agent workflow** | New rule `.cursor/rules/git-commit-and-sync.mdc` and AGENTS.md update: commit + sync obligatorios. |

### 1.2 Intended sprint alignment

- **production-hardening:** Landing upgrade, auth/roles, admin CRUD (providers, specialists, experiences, bookings, consultations), dashboards por rol, migrations 0006–0011 (marketplace, curated network, profiles). ✅ Reflected in merged state (landing kept, admin/APIs present, STATUS lists both tracks).
- **origin/main (M10–M19):** Conversion attribution, follow-up queue, deposit pricing, automation foundation, durable queue, outbound engine/command center/dispatch, launch reliability. ✅ Reflected (automation, outbound, payments idempotency, new tests).
- **Verdict:** Changes match the combined intended scope of both lines of work.

---

## 2. Risks found

| Risk | Severity | Description |
|------|----------|-------------|
| **Duplicate migration numbers (0009)** | **High** | Three migrations share the `0009_` prefix: `0009_curated_network_providers_specialists.sql`, `0009_payments_idempotency.sql`, `0009_payment_reliability.sql`. Supabase applies migrations in filename order; having multiple 0009s makes order undefined and can break fresh deploys or cause duplicate object errors. |
| **Failing tests (8)** | **Medium** | Post-merge, 8 tests fail: stripe-webhook (response shape `ignored: "payment_not_paid"`, and mock missing `bookings.update`), stripe-checkout (3), leads-api (referrer_url validation message), assessment-extended (LeadCreateSchema fields), ai-schemas (OpsTasksOutputSchema), smoke-api (error message text). CI will be red until fixed. |
| **Lead schema drift** | **Medium** | `lib/validation/lead.ts` (theirs) may omit optional fields expected by assessment/UI (e.g. specialist_ids, experience_ids, travel_companions, budget_range). assessment-extended tests expect these; current schema can make them undefined. |
| **Webhook contract** | **Low** | Test expects `{ received: true, ignored: "payment_not_paid" }`; implementation returns `{ received: true }` for non-paid. Behavioral contract mismatch only; no security impact. |

---

## 3. Security and architecture

| Check | Result |
|------|--------|
| **Admin / privileged APIs** | ✅ Protected with `requireAdmin()` (Stripe checkout, admin CRUD, AI routes, outbound, payments metrics, status/automation). |
| **Worker endpoints** | ✅ Automation worker and outbound worker require secret (`AUTOMATION_CRON_SECRET` / `CRON_SECRET`) via header; 401 when missing or wrong. |
| **Stripe webhook** | ✅ Uses raw body and Stripe signature verification; idempotent payment handling. |
| **Auth/roles** | ✅ `/api/auth/me` uses `getCurrentProfile`; dashboards and admin use role guards. |
| **Service role** | ✅ Used only in server-side APIs; not exposed to client. |
| **Sensitive config** | ✅ Server config (Zod) and env examples; no secrets in repo. |
| **Architecture** | ✅ Single merge commit; no circular deps introduced. New automation/outbound modules are additive. |

No critical security or architecture risks identified beyond the migration ordering issue.

---

## 4. Missing tests or docs

| Gap | Recommendation |
|-----|----------------|
| **Stripe webhook** | Test mock for `getServerSupabase()` does not chain `.from("bookings").update(...)`. Add chain so `from("bookings")` returns an object with `update()` returning `{ error: null }` (or match real behavior). |
| **Webhook response** | Either align implementation with test (`ignored: "payment_not_paid"`) or relax test to accept `{ received: true }`. |
| **Lead validation** | Align `LeadCreateSchema` with assessment form and tests: ensure optional fields (specialist_ids, experience_ids, travel_companions, budget_range, utm_*, landing_path, referrer_url) are defined and validated as in tests. |
| **AI schemas** | `OpsTasksOutputSchema` is undefined in test (export/import or schema name). Fix export or test import. |
| **Error messages** | leads-api and smoke tests expect `error: "Invalid input"`; API returns `"Validation failed. Check your name, email, and other fields."` — unify or relax assertion. |
| **Migrations** | Document in STATUS.md or DEPLOY_CHECKLIST.md the correct order for 0004–0011 when both “origin/main” and “curated network” migrations exist, and resolve duplicate 0009 naming (renumber or merge). |
| **SAFE_REDEPLOY_CHECKLIST** | Outdated (refers to uncommitted state and production-hardening). Update to reflect current main and Vercel deploy from main. |

---

## 5. Required fixes before merge (and before next deploy)

Since the merge to `main` is already done, “before merge” here means **before treating this as a stable release or re-deploying to production**:

1. **Mandatory**
   - **Resolve duplicate 0009 migrations:** Renumber so there is a single, well-defined order (e.g. keep one 0009, move others to 0012/0013 or merge content). Document the final order in STATUS.md and run it once in a test DB.
   - **Fix Stripe webhook test:** Extend Supabase mock to support `from("bookings").update(...)` and, if desired, align webhook response with test for non-paid sessions.

2. **Strongly recommended**
   - Fix remaining 6 failing tests (stripe-checkout, leads-api, assessment-extended, ai-schemas, smoke-api) so `npm run verify` is green.
   - Align lead validation schema with assessment form and API contract (optional fields and error messages).

3. **Optional**
   - Update SAFE_REDEPLOY_CHECKLIST and any “current branch” references to reflect main as the deploy branch and clean state.

---

## 6. Merge safety evaluation

| Criterion | Status |
|-----------|--------|
| Unmerged changes | None; `main` is in sync with `origin/main`. |
| Post-merge build | ✅ `npm run build` passes (after fixing duplicate `supabase` in checkout). |
| Post-merge tests | ❌ 8 tests failing (see above). |
| Migration order | ❌ Duplicate 0009 names must be resolved before production deploy. |
| Security review | ✅ No critical issues. |
| Docs / runbooks | ⚠️ Partially aligned; migration and redeploy docs need updates. |

---

## 7. Final recommendation

**NEEDS FIXES**

- **Merge:** Already completed; no further merge action.
- **Deploy / release:** Do **not** consider this state production-ready until:
  1. Duplicate `0009_` migrations are resolved and migration order is documented and tested.
  2. Stripe webhook tests are fixed (mock + optional response shape).
  3. Ideally: full test suite green (`npm run verify`) and lead schema/error messages aligned with tests and UI.

After the mandatory migration fix and webhook test fix, re-run this review and then recommend **SAFE TO MERGE** for any future release branch, and **SAFE TO DEPLOY** once tests are green and runbooks updated.
