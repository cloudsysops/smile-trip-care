# CLI operational audit report — canonical dev deployment

**Canonical dev host:** https://smile-transformation-platform-dev.vercel.app  
**Audit type:** Read-only, CLI-first. No schema changes, migrations, or deploys.

---

## CLI access

- **Vercel:** available (user: cboteros1-2781)
- **Supabase:** available (projects list and migration list succeeded). Local `supabase status` failed (Docker not running); not required for this audit.

---

## Vercel findings

- **Project:** `cristians-projects-70afb32e/smile-transformation-platform-dev`
- **Canonical dev host resolution:** `https://smile-transformation-platform-dev.vercel.app` is an **alias for a Production deployment** (id `dpl_6dJ6ntAKLDKR532Vv8Z9uPGnKZTV`), target **production**, status **Ready**, created 22h ago.
- **Latest deploy status:** Production deployment Ready; latest Preview deployment also Ready (7m ago).
- **SUPABASE_URL:** present — scopes: **Production, Preview, Development**. Name matches code.
- **SUPABASE_SERVICE_ROLE_KEY:** present — scopes: **Production, Preview, Development**. Name matches code.

(No secret values printed.)

---

## Code expectations for /api/leads

- **Required env vars:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (from `lib/supabase/server.ts` via `lib/config/server.ts`).
- **Critical insert step:** `supabase.from("leads").insert({ ... }).select("id").single()`. Table: `public.leads`. Columns inserted include: first_name, last_name, email, phone, country, package_slug, **package_id**, message, **specialist_ids**, **experience_ids**, **selected_specialties**, **selected_experience_categories**, **selected_experience_ids**, **travel_companions**, **budget_range**, utm_*, landing_path, referrer_url, status, **recommended_package_slug**, **recommended_package_id**.
- **Optional secondary steps:** After successful lead insert: (1) optional `bookings` insert if packageId and pkg exist (failure only logged); (2) fire-and-forget `enqueueLeadCreatedAutomationJobs` (failure only logged). Neither can change the 201 response; only the leads insert can produce the observed 500.

---

## Supabase findings

- **Linked project:** `smile-prod` (reference id `ymkqvzanvnbcxisnurle`), region East US (North Virginia). This is the only linked project in this repo.
- **Migration readiness:** `supabase migration list` shows:
  - **Local:** migrations 0001 through 0020 present.
  - **Remote (linked project smile-prod):** only **0001 through 0010** are applied. **0011 through 0020 are not applied on remote.**
- **public.leads status:** Not directly inspected (no DB shell run). From migration files:
  - 0001: creates `public.leads` with base columns (first_name, last_name, email, phone, country, package_slug, message, status, created_at, updated_at).
  - 0013: adds specialist_ids, experience_ids to leads.
  - 0015: adds package_id to leads, creates bookings table.
  - 0017: adds selected_specialties, selected_experience_categories, selected_experience_ids, travel_companions, budget_range to leads.
  - 0020: adds recommended_package_slug, recommended_package_id to leads.
  So on remote, `public.leads` exists but is **missing columns** added in 0013, 0015, 0017, 0020. The API insert sends all of these columns → Postgres will return an error (e.g. column does not exist).
- **Schema confidence:** High. Migration list is definitive: remote is behind; missing migrations 0011–0020. The insert in `app/api/leads/route.ts` uses columns from 0013, 0015, 0017, 0020.

---

## Log findings

- **Vercel function logs:** `vercel logs` for project on branch `feature/sprint-2-conversion-engine` returned “No logs found.” The canonical dev host is served by a **Production** deployment (likely from another branch, e.g. main). No runtime log line for a failing POST /api/leads was retrieved via CLI. So we could not confirm from logs the exact Postgres/Supabase error code or message.
- **Evidence used instead:** Supabase CLI `migration list` shows remote missing 0011–0020; code insert uses columns from those migrations. This is sufficient to explain the 500.

---

## Ranked root cause hypotheses

1. **Remote database has migrations 0011–0020 not applied (linked project smile-prod).** Likelihood: **Very high.** Evidence: `supabase migration list` shows remote at 0010 only; code inserts into columns added in 0013, 0015, 0017, 0020. Evidence against: none from this audit.
2. **Vercel env points to a different Supabase project that is also behind.** Likelihood: **Possible.** Evidence: we cannot see env values; if the dev host used another project, that project could also have an incomplete schema. Evidence against: the only linked project (smile-prod) is already confirmed behind; if env matches link, we have the cause.
3. **Wrong or corrupted env value (e.g. wrong key).** Likelihood: **Low.** Evidence: both var names exist in Production/Preview/Development. Evidence against: a missing or invalid key would typically cause a throw before the insert (e.g. “Supabase server config missing”) or an auth error, not necessarily the same “We could not save your request” path. We have not seen logs to distinguish.
4. **RLS or permissions.** Likelihood: **Low.** Evidence: service role bypasses RLS. Evidence against: code uses service role key; no indication of permission error in migration list.

---

## Most likely blocker

**The remote Supabase project (smile-prod, linked to this repo) has only migrations 0001–0010 applied. Migrations 0011–0020 are not applied. The POST /api/leads handler inserts into `public.leads` using columns added in 0013, 0015, 0017, and 0020 (e.g. package_id, specialist_ids, selected_specialties, recommended_package_slug, recommended_package_id). Postgres on the remote database does not have those columns, so the insert fails and the API returns 500.**

---

## Exact next manual action

**Apply the missing migrations (0011 through 0020) to the remote Supabase project used by the canonical dev host.**

- If the dev host uses the **linked** project (smile-prod), run from this repo:
  ```bash
  supabase db push
  ```
  (or apply the migration files 0011–0020 in order via Supabase Dashboard → SQL Editor, following `supabase/migrations/MIGRATION_ORDER.md`).
- After applying, redeploy or trigger a new request to the dev host and re-test: **GET /assessment → submit form → expect redirect to /assessment/proposal?lead_id=... → confirm lead in /admin/leads.**

Do not modify schema or env in this audit; this report is read-only. The next action is for the founder to apply migrations and re-verify.
