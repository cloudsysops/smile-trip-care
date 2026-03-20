# Dev QA remediation sprint — report

**Sprint goal:** Fix the dev QA environment by aligning the Supabase **dev** database with the current code, seeding minimum package data, and validating assessment submit.

**Canonical dev host:** https://smile-transformation-platform-dev.vercel.app

---

## 1. Linked Supabase project (critical finding)

| Item | Value |
|------|--------|
| **Currently linked project** | **smile-prod** |
| **Reference ID** | `ymkqvzanvnbcxisnurle` |
| **Region** | East US (North Virginia) |

**The linked project is PROD, not dev.**  
Running `npm run db:migrate` in this state would apply migrations to **production**. Migrations and seeds were **not** run in this sprint to avoid touching prod.

---

## 2. Migration result

| Status | Detail |
|--------|--------|
| **Not run** | Migrations were not executed because the linked project is prod. |
| **Required for dev** | Apply migrations to the **dev** Supabase project only (see Section 7). |

---

## 3. Seed scripts

| Status | Detail |
|--------|--------|
| **Not run** | Seeds were not run (no dev DB connection in this run). |
| **Scripts to run on dev** | In **dev** Supabase SQL Editor, run in order: `scripts/seed_packages.sql`, then `scripts/seed_marketplace_foundation.sql`. |

---

## 4. DB objects/columns to confirm (after dev is fixed)

After applying migrations and seeds to **dev**, confirm in dev Supabase (SQL Editor or Table Editor):

**Table `public.leads` — columns present:**  
`landing_path`, `referrer_url`, `package_id`, `specialist_ids`, `experience_ids`, `selected_specialties`, `selected_experience_categories`, `selected_experience_ids`, `travel_companions`, `budget_range`, `recommended_package_slug`, `recommended_package_id`.

**Tables that must exist (code expects them):**  
`bookings`, `payments`, `lead_ai`, `ai_automation_jobs`, `outbound_messages`, `stripe_webhook_events`, `providers`, `specialists`, `experiences`, `consultations`.

---

## 5. Redeploy

| Status | Detail |
|--------|--------|
| **Required** | After dev DB has migrations + seeds, redeploy the **dev** Vercel project (e.g. trigger deploy from latest `main` or “Redeploy” in Vercel). |
| **Not done in sprint** | Redeploy is a manual step in Vercel. |

---

## 6. Assessment submit and lead in admin

| Check | Status |
|-------|--------|
| Submit `/assessment` on dev host | **Not run** (manual; requires browser + dev deploy). |
| Lead appears in `/admin/leads` | **Not run** (same). |

**Action:** After dev DB is aligned and dev is redeployed, complete steps 4–6 of `docs/QA_REMEDIATION_CHECKLIST.md`.

---

## 7. Vercel logs (POST /api/leads)

| Status | Detail |
|--------|--------|
| **Not checked in sprint** | Requires submitting assessment on dev and opening Vercel → Logs filtered by `/api/leads`. |
| **Expected after fix** | No PGRST204; no “landing_path” column error. |

---

## 8. audit:prod result

| Command | Result |
|---------|--------|
| `npm run audit:prod https://smile-transformation-platform-dev.vercel.app` | **BLOCKED** in this environment: `curl` not found. Script exited with clear error (no false endpoint failures). |

**Recommendation:** Run the same command from a host that has `curl` (e.g. founder’s Mac) after dev is fixed and redeployed. Expect: `RESULT: READY` when endpoints respond 200.

---

## 9. Remaining blockers

1. **Supabase linked to prod**  
   To fix **dev** without touching prod:
   - **Option A:** Create/locate the **dev** Supabase project, get its Reference ID, then run:
     - `npx supabase link --project-ref <DEV_REF>`
     - `npm run db:migrate`
     - In **dev** SQL Editor: run `scripts/seed_packages.sql`, then `scripts/seed_marketplace_foundation.sql`.
   - **Option B:** Do not change the CLI link. In the **dev** Supabase project (Dashboard → SQL Editor), run migrations 0001 → 0020 in order (see `supabase/migrations/MIGRATION_ORDER.md`), then run the two seed scripts above.

2. **Redeploy and validate**  
   After dev DB is aligned: redeploy dev in Vercel, submit assessment on the dev host, confirm lead in `/admin/leads`, confirm no PGRST204 in Vercel logs, then run `npm run audit:prod https://smile-transformation-platform-dev.vercel.app` from a machine with `curl`.

---

## 10. Exact next steps (founder)

1. In Supabase Dashboard, open the **dev** project (not prod).
2. Apply migrations to dev:
   - **If you will link CLI to dev:**  
     `npx supabase link --project-ref <DEV_PROJECT_REF>` then `npm run db:migrate`.
   - **If you keep CLI linked to prod:**  
     In dev’s SQL Editor, run each file in `supabase/migrations/` in order 0001 → 0020 (see `MIGRATION_ORDER.md`).
3. In **dev** SQL Editor, run `scripts/seed_packages.sql`, then `scripts/seed_marketplace_foundation.sql`.
4. In Vercel, redeploy the project that serves https://smile-transformation-platform-dev.vercel.app.
5. In a browser: open the dev host → `/assessment`, submit; open `/admin/leads` and confirm the new lead.
6. In Vercel → Logs, filter by `/api/leads` and confirm no PGRST204.
7. From a machine with `curl`:  
   `npm run audit:prod https://smile-transformation-platform-dev.vercel.app`  
   and confirm `RESULT: READY`.

---

**Reference:** `docs/QA_REMEDIATION_CHECKLIST.md`, `docs/BACKEND_SCHEMA_COMPATIBILITY_AUDIT.md`, `supabase/migrations/MIGRATION_ORDER.md`.
