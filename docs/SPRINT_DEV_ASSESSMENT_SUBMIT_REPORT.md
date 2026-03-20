# Sprint: Dev assessment submit fix — Founder report

**Sprint goal:** Fix the dev assessment submit failure by aligning the dev database schema and package seed data with the current MedVoyage Smile code.

**Branch:** `feature/dev-assessment-submit-fix`  
**Risk:** MODERATE (DB migrations and seed only; no Stripe, auth, or API contract changes).

---

## Schema alignment status

| Check | Result |
|-------|--------|
| **verify:schema (before)** | OK — Remote migration state in sync with local (or ahead). |
| **db:migrate** | Migrations pushed successfully (Supabase project linked). |
| **verify:schema (after)** | OK — Remote remains in sync. |
| **Backend insert path** | Matches remote schema. The leads insert in `app/api/leads/route.ts` uses only columns added in migrations 0001–0020; all are present when migrations are applied. |

**Conclusion:** The linked Supabase project (the one used by this repo’s `supabase link`) has all migrations applied. The backend insert path and remote DB schema are aligned.

---

## Package seed status

| Check | Result |
|-------|--------|
| **Seed run in this sprint** | Not run automatically (seed requires Supabase SQL Editor or `psql` + `DATABASE_URL` against the **deployed dev** DB). |
| **Action required** | Confirm package seed on the **same** Supabase project that the **deployed dev host** uses. |

**If the deployed dev host uses this linked project:** Run the runbook Steps D and E in [SPRINT_DEV_ASSESSMENT_SUBMIT_FIX.md](SPRINT_DEV_ASSESSMENT_SUBMIT_FIX.md):

1. **Verify:** In Supabase Dashboard → SQL Editor run:
   ```sql
   select slug, name, published from public.packages
   where slug in ('essential-care-journey', 'comfort-recovery-journey', 'premium-transformation-experience');
   ```
2. **If fewer than three rows or any `published = false`:** Run the seed (Option A: `scripts/seed_marketplace_foundation.sql` or Option B: packages-only SQL from [PRODUCTION_PACKAGE_SLUGS_FIX.md](PRODUCTION_PACKAGE_SLUGS_FIX.md)).
3. Re-run the query; you should see three rows, all `published = true`.

**If the deployed dev host uses a different Supabase project:** Apply migrations (runbook Step B) and then the package seed (Step E) against **that** project (e.g. link to that project and run `npm run db:migrate`, then run the seed SQL in that project’s SQL Editor).

---

## Verification result

| Command | Result |
|---------|--------|
| **npm run verify** | PASS — Lint, test (69 tests), build completed successfully. |
| **npm run verify:schema** | PASS — Remote migration state in sync with local. |

---

## Exact next manual test steps

1. **Confirm package seed on dev DB**  
   Using the Supabase project that backs the deployed dev host:
   - Run the `select slug, name, published from public.packages where slug in (...)` query above.
   - If the three packages are missing or unpublished, run `scripts/seed_marketplace_foundation.sql` (or the packages-only SQL) in that project’s SQL Editor.

2. **Redeploy dev host (if needed)**  
   Ensure the deployed dev app is built from the same ref as main (or this branch). Trigger a redeploy if the last deploy was before migrations were applied or if you want to pick up any doc-only changes from this branch.

3. **Test assessment submit with package**  
   - Open `https://<dev-host>/assessment?package=essential-care-journey`.
   - Fill the form (first name, last name, email, etc.). Package interest can stay "Essential Care Journey" or be selected from the dropdown.
   - Submit.
   - **Expected:** Response 201, redirect to `/assessment/proposal?lead_id=...&recommended_package_slug=essential-care-journey`, proposal page loads with the recommended package.

4. **Optional smoke**  
   - Open `https://<dev-host>/packages/essential-care-journey` → expect 200 and package content.
   - Open `https://<dev-host>/api/health` → expect 200 and `"ok": true`.

---

## Migration status summary (this run)

| When | Status |
|------|--------|
| **Before** | Remote migration state in sync with local (all 20 migrations present on linked project). |
| **After** | `npm run db:migrate` reported “Migrations pushed successfully”; no new migrations were pending. |

---

## Files changed in this sprint

- **Added:** `docs/SPRINT_DEV_ASSESSMENT_SUBMIT_FIX.md` — Runbook (migration status, apply migrations, verify seed, seed packages, verification commands, report template).
- **Added:** `docs/SPRINT_DEV_ASSESSMENT_SUBMIT_REPORT.md` — This founder report.

No application code, Stripe, auth, or API contract changes.

---

## Remaining manual tasks (founder / DevOps)

- [ ] Confirm the **deployed dev** Supabase project (same as linked, or different) and run the package seed there if the three slugs are missing or unpublished.
- [ ] Run the manual test steps above on the dev host after seed (and redeploy if needed).
- [ ] If the dev host uses a different Supabase project than the linked one: link to that project (or use its `DATABASE_URL`), run `npm run db:migrate`, then run the seed SQL in that project’s SQL Editor.
