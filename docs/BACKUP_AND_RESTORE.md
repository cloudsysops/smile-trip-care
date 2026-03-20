# Backup and Restore — MedVoyage Smile

This document describes backup strategy, restore steps, and recovery expectations for the platform.

---

## Supabase backup strategy

- **Supabase (managed Postgres):** Backup behavior depends on your plan.
  - **Free tier:** No automated backups; export data manually (SQL dump or Dashboard → Database → Backups if available).
  - **Pro tier:** Daily backups retained per Supabase policy; point-in-time recovery (PITR) may be available. Check [Supabase Dashboard](https://supabase.com/dashboard) → Project → Database → Backups.
- **Recommendation:** For production, use at least Pro and confirm backup retention (e.g. 7 days). Enable PITR if offered for critical data.
- **Manual backup (any plan):** Use `pg_dump` against the project’s connection string (Settings → Database) or Supabase CLI:
  ```bash
  supabase db dump -f backup_$(date +%Y%m%d).sql
  ```
  Store dumps in a secure, off-project location (e.g. encrypted bucket, separate cloud account).

---

## What to back up

| Asset | Where | Notes |
|-------|--------|------|
| **Database** | Supabase (Postgres) | All tables: profiles, leads, payments, packages, assets, lead_ai, lead_events, bookings, etc. |
| **Migrations** | Repo `supabase/migrations/` | Version-controlled; apply in order for new environments. |
| **Storage (Supabase)** | Bucket `assets` (and future `patient-photos` if used) | Backup via Supabase Dashboard (Storage) or API; not included in `pg_dump`. |
| **Secrets** | Env (Vercel, local `.env`) | Not in repo; document where production env vars are stored and who can rotate them. |

---

## Restore steps

1. **New Supabase project (full restore):**
   - Create project; apply migrations in order (`supabase/migrations/0001_*` … `0021_*`). See [MIGRATION_ORDER.md](../supabase/migrations/MIGRATION_ORDER.md).
   - If you have a SQL dump: restore with `psql` or Supabase SQL Editor (run the dump file).
   - Recreate Storage buckets and policies if needed (Dashboard or migrations if codified).
   - Update app env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

2. **Point-in-time recovery (Supabase Pro/PITR):**
   - In Dashboard → Database → Backups (or PITR), choose restore point and follow Supabase’s restore flow.
   - After restore, verify app connectivity and run a quick smoke test (e.g. health endpoint, one read).

3. **Partial restore (e.g. single table):**
   - From a dump, extract the desired table(s) and run in SQL Editor, or use `pg_restore` with table filters if using custom dump format.

---

## Recovery time expectations (RTO)

| Scenario | Target (guidance) | Notes |
|----------|-------------------|--------|
| **Corrupt or bad deploy** | Restore from last good backup or revert deploy; < 1 hour for DB restore from dump. | Depends on dump size and Supabase/network. |
| **Supabase Pro automated restore** | Per Supabase SLA; typically same day. | Use PITR for finer granularity. |
| **Full region/account loss** | 2–4 hours to new Supabase project + env + deploy. | Assumes migrations and code in repo; secrets recreated. |

These are operational targets, not SLAs. Document your actual RTO/RPO with your team and Supabase plan.

---

## Checklist

- [ ] Confirm Supabase plan and backup retention (Dashboard or support).
- [ ] Run a manual dump and verify it restores in a test project.
- [ ] Document where production env vars and backups are stored and who has access.
- [ ] If using Storage for sensitive data (e.g. patient-photos), include Storage in backup/restore procedures.
