# QA & Release Playbook — MedVoyage Smile

Practical checklist and scripts to detect deploy/config/schema issues before and after Vercel releases. Use this to reduce user-facing errors and prevent broken assessment submissions.

**This repo is the canonical MedVoyage Smile product.** See [PRODUCT_PLATFORM_STRATEGY.md](PRODUCT_PLATFORM_STRATEGY.md) for product vs platform separation.

**Enforceable rules** (when E2E/schema/smoke are required) are defined in [ENGINEERING_WORKFLOW.md](ENGINEERING_WORKFLOW.md).

---

## A. Pre-deploy checklist

Before merging to the branch that triggers deploy (e.g. `main` or your production branch):

1. **Run full verify**
   ```bash
   npm run verify
   ```
   Ensures lint, tests, and build pass.

2. **Run schema alignment check**
   ```bash
   npm run verify:schema
   ```
   Compares local migrations to the **linked** Supabase project. If remote is behind, the script fails and recommends `supabase db push`. Fix schema before deploy to avoid 500s on POST /api/leads.

3. **Env sanity (local)**
   ```bash
   ./scripts/check_env.sh
   ```
   Validates required env vars for local/run. For Vercel, confirm in Dashboard that **Preview** and **Production** have:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   (and other required vars per docs/ENV_Y_STRIPE.md.)

4. **Canonical host reminder**
   - **Dev QA host:** `https://smile-transformation-platform-dev.vercel.app` (confirm in Vercel which project and alias).
   - Do not rely on a different host (e.g. wrong Vercel project) for QA.

5. **Optional: full release doctor**
   ```bash
   npm run doctor
   ```
   Runs git summary, critical route presence, verify, and schema check. Does not run smoke against a host unless you pass a URL:
   ```bash
   ./scripts/doctor-release.sh https://smile-transformation-platform-dev.vercel.app
   ```

---

## B. Post-deploy checklist

After a deploy completes:

1. **Smoke deploy script**
   ```bash
   npm run smoke:deploy -- https://smile-transformation-platform-dev.vercel.app
   ```
   Or:
   ```bash
   ./scripts/smoke-deploy.sh https://smile-transformation-platform-dev.vercel.app
   ```
   Verifies: `/`, `/assessment`, `/assessment/proposal`, `/login`, `/signup`, `/api/health`, `/api/leads` (pages not 404; /api/health 200; /api/leads non-404).

2. **Assessment submit manual test**
   - Open `/assessment` on the deploy host.
   - Fill and submit the evaluation form.
   - Expect: no user-facing error; redirect to `/assessment/proposal?lead_id=...`.
   - Confirm the proposal page loads.

3. **Confirm lead in admin**
   - Log in as admin.
   - Open `/admin/leads`.
   - Confirm the new lead appears in the list.

4. **Confirm no user-facing error**
   - No generic “Something went wrong” or “We could not save your request” on submit.
   - If you see those, check Vercel function logs for “Lead insert failed” (see Troubleshooting).

---

## C. Troubleshooting

### Wrong Vercel host

- **Symptom:** Smoke or manual test on a URL that isn’t the canonical dev/prod host.
- **Fix:** Use the correct project URL (e.g. `https://smile-transformation-platform-dev.vercel.app` for dev). Confirm in Vercel → Project → Settings → Domains / Deployments.

### Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY

- **Symptom:** 500s or “Server error”; in logs you may see “Supabase server config missing”.
- **Fix:** In Vercel → Project → Settings → Environment Variables, add both for the scope that serves the deployment (Preview and/or Production). Redeploy after changing env.

### Remote schema behind local migrations

- **Symptom:** POST /api/leads returns 500 “We could not save your request.” Vercel logs show “Lead insert failed” with a Postgres/Supabase error (e.g. column does not exist).
- **Fix:** Apply missing migrations to the **same** Supabase project that Vercel uses:
  ```bash
  supabase db push
  ```
  Or apply migration files 0011–0020 (and any others) in order via Supabase Dashboard → SQL Editor (see `supabase/migrations/MIGRATION_ORDER.md`). Then re-test the assessment submit.

### Optional secondary insert issues

- **Symptom:** Lead is created (201) but booking or automation enqueue fails (logged as warning/error). User still sees success and redirect.
- **Fix:** Non-blocking for the user. Fix bookings table or automation queue/credentials if you need those features; they do not change the 201 response.

### How to inspect Vercel logs

1. Vercel Dashboard → your project → **Logs** (or **Functions**).
2. Reproduce the failure (e.g. submit assessment).
3. Find the request for `POST /api/leads`.
4. Look for log line **“Lead insert failed”** with `request_id`, `step`, `table`, `supabase_code`, `supabase_message`, `supabase_hint`. Use these to confirm missing column, FK violation, or permission issue.

---

## E2E (Playwright)

- **Run:** `npm run test:e2e`. Uses `BASE_URL` or `PLAYWRIGHT_BASE_URL` if set; otherwise defaults to the canonical dev Vercel host.
- **Local:** For tests to match the current codebase, run against local: `BASE_URL=http://localhost:3000 npm run test:e2e` (with `npm run dev` running). Against a deploy host, the deployed build must be from the same branch for selectors to match.
- **Coverage:** Assessment happy path, proposal render + WhatsApp CTA, mobile assessment smoke. See `e2e/*.spec.ts`. No mocks; assessment submit hits real POST /api/leads.

---

## Script reference

| Script | Purpose | Usage |
|--------|---------|--------|
| `scripts/check-supabase-schema.sh` | Compare local vs remote migrations; fail if remote behind | `npm run verify:schema` or `./scripts/check-supabase-schema.sh` |
| `scripts/doctor-release.sh` | Release-readiness audit (git, routes, verify, schema, optional smoke) | `npm run doctor` or `./scripts/doctor-release.sh [HOST]` |
| `scripts/smoke-deploy.sh` | Smoke test critical routes on a host | `npm run smoke:deploy -- <HOST>` or `./scripts/smoke-deploy.sh <HOST>` |
| `scripts/check_env.sh` | Validate required env vars (local) | `./scripts/check_env.sh` |
| `scripts/smoke_test.sh` | Minimal health check (/api/health, /api/health/ready) | `./scripts/smoke_test.sh [BASE_URL]` |

All scripts are intended to be run from the **repo root**.
