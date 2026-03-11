# Sprint: Fix dev assessment submit failure

**Sprint goal:** Align the dev database schema and package seed data with the current MedVoyage Smile code so that assessment submit (including `?package=essential-care-journey`) succeeds on the deployed dev host.

**Risk:** MODERATE (migrations and seed touch DB; no Stripe/auth/API contract changes).

**Hard constraints respected:** No Stripe core/webhook changes; no auth core changes; no API contract changes; no broad refactor.

---

## 1. Current state audit

### Strengths
- Codebase has a single leads insert path in `app/api/leads/route.ts` with a well-defined column set.
- Migrations 0001–0020 are defined and ordered in `supabase/migrations/` and `MIGRATION_ORDER.md`.
- Seed scripts exist: `scripts/seed_marketplace_foundation.sql` (full) and a packages-only block in `docs/PRODUCTION_PACKAGE_SLUGS_FIX.md`.
- Schema check script exists: `scripts/check-supabase-schema.sh` compares local migrations to linked remote.

### Weaknesses
- Dev host DB may have been created before all migrations or never seeded with the three package slugs.
- Without the three packages (e.g. `essential-care-journey`) existing and published, assessment submit can still succeed but package resolution and proposal/thank-you UX are broken; 500 can also occur if schema is behind (missing columns).

### Blockers
- None in code. Blocker is operational: migrations and seed must be run against the **same** Supabase project that the dev host uses.

### Assumptions
- The deployed dev host uses a single Supabase project (the one linked via `supabase link` or the one whose `DATABASE_URL` is in Vercel env for that project).
- Founder or DevOps can run `npm run db:migrate` and/or paste SQL into Supabase SQL Editor.

### Likely impact
- Once schema is aligned and packages seeded: assessment submit returns 201, redirects to proposal, and package pages load.

---

## 2. Required columns for leads insert (schema alignment)

The backend `POST /api/leads` insert uses these columns. All must exist on the remote `public.leads` table (from migrations 0001–0020):

| Column | Added in | Required |
|--------|----------|----------|
| first_name, last_name, email, phone, country, package_slug, message, status, created_at, updated_at | 0001, 0017 | Yes |
| utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_path, referrer_url | 0004 | Yes |
| package_id | 0015 | Yes |
| specialist_ids, experience_ids | 0013 | Yes |
| selected_specialties, selected_experience_categories, selected_experience_ids, travel_companions, budget_range | 0017 | Yes |
| recommended_package_slug, recommended_package_id | 0020 | Yes |

If any of these are missing, the insert will fail with a Postgres error (e.g. column does not exist) and the API returns 500.

---

## 3. Runbook: migration status, apply migrations, seed packages

### Step A — Verify migration status (before)

From repo root, with Supabase CLI installed and project linked:

```bash
npx supabase migration list
```

Or run the schema checker (exits 1 if remote is behind):

```bash
npm run verify:schema
```

**Record the output** as “migration status before” (e.g. “Remote in sync” or “Remote missing 0017, 0020”).

### Step B — Apply all pending migrations

**Option 1 (recommended):** Linked project

```bash
npx supabase db push --yes
```

**Option 2:** Direct Postgres (set `DATABASE_URL` in `.env.local` or env, then):

```bash
export DATABASE_URL="postgresql://..."   # from Supabase Dashboard → Settings → Database
npm run db:migrate
```

**Option 3:** Manual. In Supabase Dashboard → SQL Editor, run each file in `supabase/migrations/` in lexicographic order (0001 → 0020). See `supabase/migrations/MIGRATION_ORDER.md`.

### Step C — Verify migration status (after)

Run again:

```bash
npx supabase migration list
# and/or
npm run verify:schema
```

**Record** as “migration status after”. Expect: all local migrations applied on remote (or remote ahead).

### Step D — Check whether package seed exists

In Supabase Dashboard → SQL Editor, run:

```sql
select slug, name, published from public.packages
where slug in ('essential-care-journey', 'comfort-recovery-journey', 'premium-transformation-experience');
```

- If you see **three rows** with `published = true` → package seed already exists; skip Step E.
- If **fewer than three** or any `published = false` → run Step E.

### Step E — Seed the required packages

**Option 1 (recommended):** Full marketplace seed (provider, specialists, experiences, packages, junctions):

```bash
# With DATABASE_URL set:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/seed_marketplace_foundation.sql
```

Or paste the contents of `scripts/seed_marketplace_foundation.sql` into Supabase SQL Editor and run.

**Option 2:** Packages only (minimal change). Paste and run the “Option B” SQL block from `docs/PRODUCTION_PACKAGE_SLUGS_FIX.md` (insert into `public.packages` for the three slugs with `on conflict (slug) do update set ...`).

Then re-run the check from Step D. You should see three rows, all `published = true`.

### Step F — Confirm backend insert path matches remote schema

- Run `npm run verify:schema`. If it passes, remote has all migrations; the insert path in code expects exactly those columns.
- No code change required for “match”; the codebase already inserts the set listed in §2.

---

## 4. Verification commands

From repo root:

```bash
npm run verify
npm run verify:schema
```

- **verify:** lint, test, build. Must pass before considering the sprint complete.
- **verify:schema:** ensures remote migration state is not behind local (exits 1 if behind).

---

## 5. Founder-readable report

See **[SPRINT_DEV_ASSESSMENT_SUBMIT_REPORT.md](SPRINT_DEV_ASSESSMENT_SUBMIT_REPORT.md)** for the filled report (migration status before/after, package seed status, verification result, exact next manual test steps).

**Exact next manual test steps:**

1. Deploy the dev host from the same ref as main (or this branch) so code matches the schema.
2. Open `https://<dev-host>/assessment?package=essential-care-journey`.
3. Fill the assessment form (name, email, etc.); leave or set “Package interest” to Essential Care Journey. Submit.
4. Expect: HTTP 201 from POST /api/leads, redirect to `/assessment/proposal?lead_id=...&recommended_package_slug=essential-care-journey`, proposal page loads with recommendation.
5. Optional: Open `https://<dev-host>/packages/essential-care-journey` and confirm 200 and package content.

---

## 6. References

- [DIAGNOSIS_ASSESSMENT_SUBMIT_DEV.md](DIAGNOSIS_ASSESSMENT_SUBMIT_DEV.md) — Why submit was failing (schema/seed).
- [PRODUCTION_PACKAGE_SLUGS_FIX.md](PRODUCTION_PACKAGE_SLUGS_FIX.md) — Package slugs fix and packages-only SQL.
- [MIGRATION_ORDER.md](../supabase/migrations/MIGRATION_ORDER.md) — Order of migrations.
- [app/api/leads/route.ts](../app/api/leads/route.ts) — Leads insert path.
