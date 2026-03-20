# Engineering Workflow — MedVoyage Smile

Defines the repeatable process for development, verification, and release so that critical product changes are test-backed and deploy risk is minimized.

**Target workflow:** Develop → Verify → Schema Check → E2E → Deploy → Smoke Test

---

## When E2E is required

- **Required:** When a PR touches **critical user flows**: assessment funnel (steps, submit, redirect), proposal page (savings, trust, CTAs), login/signup, lead creation path, or any path that affects conversion or lead visibility.
- **Required:** When adding or changing UI or behavior on `/assessment`, `/assessment/proposal`, or primary CTAs (e.g. WhatsApp, deposit).
- **Expected:** Add or update E2E tests in `e2e/` so the changed flow is covered. Run `npm run test:e2e` (or the relevant spec) before merge.
- **Not required:** Pure backend/internal API changes that have no user-facing flow (unit/integration tests suffice). Docs-only or config-only changes may skip E2E if no flow is affected.

---

## When schema checks are required

- **Required:** When a PR touches **Supabase-dependent code**: lead insert, bookings, migrations, or any server code that reads/writes Supabase tables.
- **Required:** Before **any deploy** that could hit a Supabase-backed endpoint (assessment submit, admin, payments).
- **Action:** Run `npm run verify:schema` before merge and before deploy. If remote is behind local migrations, fix with `supabase db push` (or apply migrations in Supabase Dashboard) before releasing.
- **Rule:** If you change or add migrations in the repo, schema alignment must be checked and remote must be updated before the deploy that depends on the new schema.

---

## Pre-merge checklist

Before merging a PR (especially into the branch that triggers deploy):

1. **Lint and unit/integration tests:** `npm run verify` passes.
2. **Schema alignment (if PR touches Supabase or deploy):** `npm run verify:schema` passes or is explicitly skipped with reason (e.g. docs-only).
3. **E2E (if PR touches critical user flows):** `npm run test:e2e` passes, or new/updated E2E tests are added and passing.
4. **No contract changes:** API request/response shapes and public routes are unchanged unless explicitly approved.

---

## Pre-deploy checklist

Before or immediately after a deploy (see also [QA_RELEASE_PLAYBOOK.md](QA_RELEASE_PLAYBOOK.md)):

1. **Verify:** `npm run verify` passes on the branch being deployed.
2. **Schema check:** `npm run verify:schema` passes. If it fails, apply missing migrations to the Supabase project used by the deploy target, then re-run.
3. **Optional but recommended:** `npm run doctor` (and with host: `./scripts/doctor-release.sh <CANONICAL_HOST>`).
4. **Canonical environment:** Confirm the deploy target (Preview/Production) has the correct env vars (e.g. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) and points to the intended Supabase project.

---

## Post-deploy checklist

After every deploy:

1. **Smoke deploy:** Run `npm run smoke:deploy -- <CANONICAL_HOST>` (e.g. `https://smile-transformation-platform-dev.vercel.app`). All listed routes must pass (pages not 404, `/api/health` 200, `/api/leads` non-404).
2. **Assessment funnel (manual):** Open `/assessment` → complete and submit → expect redirect to `/assessment/proposal?lead_id=...` and no user-facing error.
3. **Admin lead visibility (manual):** Log in as admin → open `/admin/leads` → confirm the new lead appears.
4. **Optional:** Run E2E against the deploy host: `BASE_URL=<CANONICAL_HOST> npm run test:e2e`.

---

## Rules for critical user flows

- **Assessment funnel:** Any change to steps, submit handler, redirect logic, or payload to `/api/leads` must be covered by unit/integration tests and, where applicable, E2E (assessment happy path or error path).
- **Proposal page:** Changes to savings block, trust section, timeline, or primary CTAs (WhatsApp, packages, deposit) should be reflected in E2E (proposal render, WhatsApp CTA).
- **Critical flows** are documented in [QA_RELEASE_PLAYBOOK.md](QA_RELEASE_PLAYBOOK.md) (pre-deploy, post-deploy, troubleshooting).

---

## Rules for Supabase-related changes

- **No schema change in production** without a migration and without applying it to the target project. Do not edit migrations that have already been applied (prefer new migrations).
- **Before deploy:** If the app code expects columns/tables from migrations that are not yet on the remote project, run `supabase db push` (or apply via Dashboard) and re-run `npm run verify:schema`.
- **Env:** The deploy target must have `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set for the same Supabase project that has the expected schema.

---

## Reuse-first rule

To avoid duplication and keep the product coherent:

1. **Before designing a new flow or component:**
   - Check `docs/` for existing specs or decisions (e.g. `ARCHITECTURE.md`, `PRODUCT_PLATFORM_STRATEGY.md`, `QA_RELEASE_PLAYBOOK.md`).
   - Search the codebase for existing components/helpers/APIs that solve a similar problem.
2. **Prefer extending existing patterns** (components, helpers, endpoints) instead of creating parallel ones (e.g. no second assessment flow, no duplicate Stripe webhook, no new lead table).
3. Only introduce a new pattern when there is no reasonable reusable equivalent or the existing pattern is explicitly deprecated.

This rule applies especially to:

- Assessment and lead capture
- Admin lead views and follow-up
- Stripe checkout + webhook
- AI agents (lead copilot, follow-up, automation)

---

## Expectation: critical product changes must be test-backed

- **Critical product change:** Anything that affects assessment completion, proposal conversion, lead creation, payments, or admin visibility of leads.
- **Test-backed means:** Relevant unit or integration tests exist and pass, and for user-facing flows, E2E coverage exists and is run before merge (and optionally after deploy).
- New features that introduce new critical flows must add the corresponding E2E tests in `e2e/`.

---

## Enforceable rules (summary)

| Condition | Requirement |
|-----------|-------------|
| PR touches critical user flows | E2E coverage must be added or updated; E2E run before merge. |
| PR touches Supabase-dependent code | Schema alignment must be checked before merge; remote must be in sync before deploy. |
| A deploy occurs | Smoke-deploy must be run against the canonical host for that deploy. |
| Environment config changes | Canonical environment docs (e.g. ENV_Y_STRIPE.md, QA_RELEASE_PLAYBOOK.md) must be updated. |

---

## Script and doc reference

- **Verify:** `npm run verify` (lint, test, build)
- **Schema:** `npm run verify:schema` → `scripts/check-supabase-schema.sh`
- **Doctor:** `npm run doctor` or `./scripts/doctor-release.sh [HOST]`
- **Smoke deploy:** `npm run smoke:deploy -- <HOST>` → `scripts/smoke-deploy.sh`
- **E2E:** `npm run test:e2e` (Playwright; baseURL from `BASE_URL` or `PLAYWRIGHT_BASE_URL` or default dev host)
- **Playbook:** [QA_RELEASE_PLAYBOOK.md](QA_RELEASE_PLAYBOOK.md) — pre-deploy, post-deploy, troubleshooting, script reference.
