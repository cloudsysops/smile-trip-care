# Backend schema compatibility audit

**Goal:** Detect missing tables, columns, or DB expectations in QA/dev (and avoid production breaks).

**Known QA failure:** `POST /api/leads` → PGRST204: `Could not find the 'landing_path' column of 'leads' in the schema cache`.

**Risk:** SAFE / MODERATE — audit only; no code refactors or new speculative migrations unless clearly necessary.

---

## 1. Summary

- **Tables audited (writes):** `leads`, `bookings`, `payments`, `profiles`, `lead_ai`, `itineraries`, `ai_automation_jobs`, `outbound_messages`, `stripe_webhook_events`, `assets`, `consultations`, `providers`, `specialists`, `experiences`, `packages`.
- **Critical mismatch (confirmed in QA):** `leads.landing_path` (and full attribution set from migration 0004) missing in dev DB.
- **Other likely drift:** `consultations.requested_at` is selected in code but **never added in any migration**; if dev has only 0013/0017, coordinator/patient/specialist dashboard reads can fail with PGRST204.
- **Exact migration for `landing_path`:** `supabase/migrations/0004_leads_attribution.sql`.
- **Dev DB status:** Behind (at least 0004 not applied; possibly more).

---

## 2. DB writes inventory (code → schema)

### 2.1 Critical flows (lead, payment, auth)

| Table       | File / route                          | Operation | Columns used in write |
|------------|----------------------------------------|-----------|------------------------|
| **leads**  | `app/api/leads/route.ts`               | insert    | first_name, last_name, email, phone, country, package_slug, package_id, message, specialist_ids, experience_ids, selected_specialties, selected_experience_categories, selected_experience_ids, travel_companions, budget_range, utm_source, utm_medium, utm_campaign, utm_term, utm_content, **landing_path**, referrer_url, status, recommended_package_slug, recommended_package_id |
| **bookings** | `app/api/leads/route.ts`            | insert    | lead_id, package_id, provider_id, status, deposit_cents |
| **bookings** | `app/api/stripe/webhook/route.ts`   | update    | status, updated_at |
| **leads**  | `app/api/stripe/webhook/route.ts`     | update    | status, updated_at |
| **payments** | `app/api/stripe/checkout/route.ts`  | insert    | lead_id, stripe_checkout_session_id, amount_cents, status |
| **payments** | `app/api/stripe/webhook/route.ts`   | insert    | lead_id, stripe_checkout_session_id, amount_cents, status, updated_at |
| **payments** | `app/api/stripe/webhook/route.ts`   | update    | status, updated_at |
| **profiles** | `app/auth/callback/route.ts`        | insert    | id, email, full_name, role, is_active |
| **profiles** | `app/api/signup/route.ts`           | insert    | id, email, full_name, role, is_active |

**Migrations that define these columns:**

- **leads (full set):** 0001 (base), 0004 (utm_*, **landing_path**, referrer_url), 0006 (last_contacted_at, next_follow_up_at, follow_up_notes), 0013 (specialist_ids, experience_ids), 0015 (package_id), 0017 (selected_specialties, selected_experience_categories, selected_experience_ids, travel_companions, budget_range, updated_at), 0020 (recommended_package_slug, recommended_package_id).
- **bookings:** 0015 (table + lead_id, package_id, provider_id, status, deposit_cents, created_at, updated_at), 0017 (total_price_usd, deposit_paid, start_date, end_date, notes, status check).
- **payments:** 0001 (lead_id, stripe_payment_intent_id, stripe_checkout_session_id, amount_cents, status, created_at, updated_at); 0011 (stripe_webhook_events); 0012 (idempotency indexes).
- **profiles:** 0001 (id, email, full_name, role, updated_at), 0018 (provider_id, specialist_id, is_active, created_at, role check).

**Conclusion:** If dev has not run **0004_leads_attribution.sql**, the leads insert fails with PGRST204 on `landing_path`. Other columns in that insert are added in 0013, 0015, 0017, 0020 — if any of those are missing, the same insert can fail on the corresponding column.

---

### 2.2 Automation, AI, outbound

| Table                 | File / route                              | Operation | Columns |
|-----------------------|--------------------------------------------|-----------|---------|
| **ai_automation_jobs** | `lib/automation/queue.ts`                 | upsert    | lead_id, trigger_type, job_type, status, attempts, max_attempts, run_after, payload_json, updated_at |
| **ai_automation_jobs** | `lib/automation/queue.ts`                 | update    | status, run_after, locked_at, locked_by, updated_at, error_message |
| **lead_ai**           | `lib/ai/persist.ts`, `lib/ai/automation.ts` | insert/update | lead_id, triage_json, messages_json, ops_json, triage_completed, response_generated, itinerary_generated, ops_generated, updated_at |
| **itineraries**       | `lib/ai/persist.ts`, `lib/ai/automation.ts` | insert    | lead_id, package_id, city, content_json, day_index, title, description, updated_at |
| **outbound_messages** | `app/api/admin/leads/[id]/outbound/route.ts` | insert    | lead_id, source, channel, status, subject, body_text, scheduled_for, created_by, approved_by, updated_at |

**Migrations:** 0005 (lead_ai ops_json), 0008 (lead_ai triage/response/itinerary/ops flags + followup json), 0009 (ai_automation_jobs table), 0010 (outbound_messages table), 0003 (lead_ai triage_json, messages_json; itineraries lead_id, city, content_json).

---

### 2.3 Admin CRUD (assets, leads, providers, specialists, experiences, bookings, consultations)

| Table           | Lib/route                    | Operation | Note |
|-----------------|------------------------------|-----------|------|
| **assets**      | `app/api/admin/assets/upload/route.ts`, `[id]/route.ts` | insert, update | 0001 + 0002 columns |
| **leads**       | `app/api/admin/leads/[id]/route.ts` | update | partial updates |
| **outbound_messages** | `app/api/admin/outbound-messages/[id]/route.ts` | update | patch; also leads update |
| **consultations** | `lib/consultations.ts`     | insert, update | scheduled_date, scheduled_time, scheduled_at (0013, 0017) |
| **providers**   | `lib/providers.ts`           | insert, update | 0014, 0016, 0017 |
| **specialists** | `lib/specialists.ts`         | insert, update | 0013, 0016, 0017 |
| **experiences** | `lib/experiences.ts`         | insert, update | 0013, 0017 |
| **packages**    | `lib/packages.ts`           | update   | 0014, 0017 |
| **bookings**    | `lib/bookings.ts`           | insert, update | 0015, 0017 |

---

## 3. Reads that depend on specific columns (potential PGRST204)

| Location | Table           | Columns selected | Migration that adds them |
|----------|-----------------|------------------|---------------------------|
| `lib/dashboard-data.ts` | consultations | **requested_at**, scheduled_at | scheduled_at in 0017; **requested_at not in any migration** |
| `app/admin/leads/[id]/page.tsx` | leads | landing_path, … | 0004 |
| `app/admin/analytics/page.tsx` | leads | id, created_at, package_slug, country | 0001, 0004 (country in 0001) |
| `app/api/health/ready/route.ts` | packages | id | 0001 |

**Critical finding:** The code selects `consultations.requested_at` in several places (dashboard-data, patient, coordinator, specialist pages). There is **no migration** that adds `requested_at` to `consultations`. So:

- If the dev DB was created only from migrations in this repo, **requested_at does not exist**.
- Any SELECT that includes `requested_at` (e.g. coordinator dashboard, patient dashboard, specialist page) can return PGRST204 in that environment.

---

## 4. Exact migration file for `landing_path`

- **File:** `supabase/migrations/0004_leads_attribution.sql`
- **Adds:** utm_source, utm_medium, utm_campaign, utm_term, utm_content, **landing_path**, referrer_url + indexes.
- **Order:** Run after 0001, 0002, 0003 (see `MIGRATION_ORDER.md`).

**Manual step to fix QA (minimal — attribution columns only):**  
In the **dev Supabase** project (Dashboard → SQL Editor), run:

```sql
-- From 0004_leads_attribution.sql (attribution columns required by POST /api/leads)
alter table public.leads add column if not exists utm_source text;
alter table public.leads add column if not exists utm_medium text;
alter table public.leads add column if not exists utm_campaign text;
alter table public.leads add column if not exists utm_term text;
alter table public.leads add column if not exists utm_content text;
alter table public.leads add column if not exists landing_path text;
alter table public.leads add column if not exists referrer_url text;

create index if not exists idx_leads_utm_source on public.leads(utm_source) where utm_source is not null;
create index if not exists idx_leads_utm_campaign on public.leads(utm_campaign) where utm_campaign is not null;
```

**Recommended (full sync):** Apply all migrations in order (0001 → 0020) via `npm run db:migrate` with dev Supabase linked, or run each `supabase/migrations/*.sql` in the order listed in `supabase/migrations/MIGRATION_ORDER.md`.

---

## 5. Mismatch report (severity)

| # | Table        | Issue | Code path | User-facing impact | Severity |
|---|-------------|--------|-----------|--------------------|----------|
| 1 | **leads**   | Missing column `landing_path` (and possibly other attribution/extension columns) | `app/api/leads/route.ts` insert | Assessment submit fails; "We could not save your request" | **Critical** (confirmed in QA) |
| 2 | **consultations** | Column `requested_at` selected in code but **not added in any migration** | `lib/dashboard-data.ts`; coordinator/patient/specialist pages | Coordinator/patient/specialist dashboard or consultation lists can 500 / PGRST204 | **Medium** |

No other **write** paths were found that reference a column not present in migrations. The only other **read** mismatch identified is `consultations.requested_at`.

---

## 6. Likely dev DB drift areas

1. **Migration 0004 not applied** — Confirmed by PGRST204 on `landing_path`. Fix: run 0004 (or the minimal SQL above) on dev.
2. **Migrations 0005–0020** — If dev was provisioned early, it may be missing 0006 (leads follow-up), 0013 (leads specialist/experience IDs), 0015 (bookings, leads.package_id), 0017 (leads selected_*, travel_companions, budget_range; bookings extensions; consultations.scheduled_at), 0020 (recommended_package_*). Any of these gaps can cause inserts/updates to fail or return unexpected columns.
3. **consultations.requested_at** — Never added by migrations; code expects it. Either add a small migration (e.g. `alter table public.consultations add column if not exists requested_at timestamptz`) or change the code to stop selecting/ordering by `requested_at` (e.g. use `created_at`).

---

## 7. Top critical blockers

1. **Apply 0004 (or full migration set) to dev** — Required for `POST /api/leads` to succeed and for assessment submit to work in QA.
2. **Resolve consultations.requested_at** — Either add the column in a migration or remove it from SELECT/ORDER in `lib/dashboard-data.ts` and any UI that displays it (to avoid PGRST204 on coordinator/patient/specialist flows).

---

## 8. Exact next steps to make QA match code

1. **Fix leads (unblock assessment submit)**  
   - In dev Supabase: run the SQL block from section 4 (0004 attribution columns + indexes), **or**  
   - Run full migration sequence: `npm run db:migrate` (with dev linked) or execute 0001 → 0020 in order in SQL Editor.

2. **Verify**  
   - Redeploy or use current dev deploy.  
   - Submit assessment on dev; confirm lead appears in `/admin/leads`.  
   - Check Vercel logs for `/api/leads`: no more PGRST204.

3. **consultations.requested_at (optional but recommended)**  
   - **Option A:** Add migration: `alter table public.consultations add column if not exists requested_at timestamptz;` (and backfill from `created_at` if desired).  
   - **Option B:** Change code to stop using `requested_at` (e.g. select/order by `created_at` or `scheduled_at` only) and update types.  
   - Then re-test coordinator/patient/specialist dashboards that load consultations.

4. **No speculative batch migrations** — Only 0004 (or full 0001–0020) and, if chosen, the single `requested_at` addition are recommended. No other missing columns were found for the audited write paths.

---

## 9. Files and routes audited (reference)

- **Writes:** `app/api/leads/route.ts`, `app/api/stripe/webhook/route.ts`, `app/api/stripe/checkout/route.ts`, `app/auth/callback/route.ts`, `app/api/signup/route.ts`, `lib/automation/queue.ts`, `lib/ai/persist.ts`, `lib/ai/automation.ts`, `app/api/admin/leads/[id]/outbound/route.ts`, `app/api/admin/assets/upload/route.ts`, `app/api/admin/assets/[id]/route.ts`, `app/api/admin/leads/[id]/route.ts`, `app/api/admin/outbound-messages/[id]/route.ts`, `lib/consultations.ts`, `lib/bookings.ts`, `lib/providers.ts`, `lib/specialists.ts`, `lib/experiences.ts`, `lib/packages.ts`, `app/api/automation/payments-reconcile/route.ts`, `app/api/automation/outbound-worker/route.ts`, `app/api/ai/triage/route.ts`, `app/api/ai/respond/route.ts`, `app/api/ai/itinerary/route.ts`.
- **Reads (column-sensitive):** `lib/dashboard-data.ts`, `app/admin/leads/[id]/page.tsx`, `app/admin/analytics/page.tsx`, `app/admin/overview/page.tsx`, `app/api/health/ready/route.ts`.
- **Migrations:** `supabase/migrations/0001_init.sql` through `0020_leads_recommended_package.sql`; `MIGRATION_ORDER.md`.

---

**Document version:** 1.0  
**Date:** 2026-03  
**Scope:** Backend schema compatibility for MedVoyage Smile QA/dev; no Stripe/auth/API contract changes.
