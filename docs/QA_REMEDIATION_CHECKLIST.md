# QA remediation checklist (post–schema fix)

Use this after applying migrations and seeds to the **dev** Supabase project so that assessment submit and admin flows work in QA.

**Prereq:** Supabase **dev** project linked (or run migrations/seeds manually in SQL Editor against **dev**). If `npx supabase projects list` shows the linked project as **prod**, do **not** run `npm run db:migrate` until you link to dev (`npx supabase link --project-ref <DEV_REF>`) or apply migrations manually to dev only. See `docs/DEV_QA_REMEDIATION_SPRINT_REPORT.md`.

---

## Steps (in order)

| # | Step | Command / action |
|---|------|-------------------|
| 1 | Apply migrations | `npm run db:migrate` |
| 2 | Seed packages + marketplace foundation | Run in Supabase SQL Editor (dev): `scripts/seed_packages.sql`, then `scripts/seed_marketplace_foundation.sql` |
| 3 | Redeploy dev | In Vercel: redeploy the dev project (e.g. from latest `main` or trigger deploy) |
| 4 | Submit assessment | On dev host: open `/assessment`, fill and submit |
| 5 | Confirm lead in admin | Open `/admin/leads` and confirm the new lead appears |
| 6 | Confirm no PGRST204 in Vercel logs | Vercel → Project → Logs, filter by `/api/leads`; verify no PGRST204 / `landing_path` error |
| 7 | Run production audit | `npm run audit:prod https://<dev-host>` (e.g. `https://smile-transformation-platform-dev.vercel.app`) |

---

## Success criteria

- Step 1: Migrations run without errors (0001 → 0020).
- Step 2: No SQL errors; `packages` has at least one published row if your app expects it.
- Step 4–5: Assessment submit returns success; lead visible in `/admin/leads`.
- Step 6: No PGRST204 in logs for `POST /api/leads`.
- Step 7: `RESULT: READY` (or no failures on critical routes).

---

**Reference:** `docs/BACKEND_SCHEMA_COMPATIBILITY_AUDIT.md`, `supabase/migrations/MIGRATION_ORDER.md`.
