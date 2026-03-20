# Diagnosis: Assessment submit fails on deployed dev host (`?package=essential-care-journey`)

**Date:** 2026-03-08  
**Scope:** Why POST from `/assessment?package=essential-care-journey` errors on the deployed dev host.  
**Output:** Flow trace, root cause (deploy lag vs backend logic), exact failing step, minimal fix.

---

## 1. Assessment submit flow (with and without `package`)

### 1.1 With `?package=essential-care-journey`

| Step | Where | What happens |
|------|--------|----------------|
| 1 | URL | User opens `https://<dev-host>/assessment?package=essential-care-journey`. |
| 2 | `app/assessment/page.tsx` | Server reads `searchParams.package` → `prefillPackageSlug = "essential-care-journey"`. Fetches `getPublishedPackages()`, passes `prefillPackageSlug` to `AssessmentWizard`. |
| 3 | `AssessmentWizard.tsx` | Initial state: `package_slug: prefillPackageSlug` (so `"essential-care-journey"`). User fills name, email, etc., and submits. |
| 4 | Submit handler | Builds `body` with `package_slug: data.package_slug \|\| undefined` → `"essential-care-journey"`. POST to `/api/leads` with `Content-Type: application/json`. |
| 5 | `POST /api/leads` | Parses JSON; `LeadCreateSchema.safeParse(body)`. `package_slug` is optional (max 100) → passes. |
| 6 | Package lookup | `packageSlug = "essential-care-journey"`; `pkg = await getPublishedPackageBySlug(packageSlug)`; `packageId = pkg?.id ?? null`. |
| 7 | Insert leads | `supabase.from("leads").insert({ ... package_slug, package_id, recommended_package_slug, recommended_package_id, ... }).select("id").single()`. |
| 8 | Booking (if pkg) | If `lead.id && packageId && pkg`, insert into `bookings`. |
| 9 | Response | 201 with `lead_id`, `recommended_package_slug`. Frontend redirects to `/assessment/proposal?lead_id=...&recommended_package_slug=...`. |

### 1.2 Without `package` query param

- `prefillPackageSlug = ""`.
- User may leave "Package interest" empty or type a slug.
- Same API: `package_slug` optional; `getPublishedPackageBySlug("")` is not called (we use `packageSlug ? await getPublishedPackageBySlug(packageSlug) : null`). So with empty slug, `pkg = null`, `packageId = null`, lead insert has `package_id` and `recommended_package_id` null. No booking. Insert still succeeds if DB schema matches.

**Conclusion:** The only difference with `?package=essential-care-journey` is that we send a non-empty `package_slug` and the API looks up the package. If the package is **missing or unpublished** in the DB, `pkg` is null and we insert with `package_id`/`recommended_package_id` null — **insert does not require the package to exist**. So validation, package lookup, and null handling are correct; failure is almost certainly **DB or deploy**, not “package must exist” logic.

---

## 2. How `package=essential-care-journey` is mapped

| Layer | Mapping |
|-------|--------|
| **URL** | `?package=essential-care-journey` (query param name is `package`). |
| **Page** | `searchParams.package` → `prefillPackageSlug`. |
| **Wizard** | Form state `data.package_slug = prefillPackageSlug` (and user can change it). |
| **Submit body** | `package_slug: data.package_slug \|\| undefined` → sent as `"essential-care-journey"` in JSON. |
| **API** | `LeadCreateSchema` accepts `package_slug` (optional, max 100). Then `getPublishedPackageBySlug(slug)` → one row from `packages` where `slug = $1` and `published = true`, else `null`. |
| **DB** | `leads.package_slug` stores the string; `leads.package_id` and `leads.recommended_package_id` store UUID or null. |

So the slug is passed through end-to-end; the API **does** accept it and **does** resolve it to a package when the row exists and is published.

---

## 3. POST /api/leads and package resolution

- **Accepts:** `package_slug` (optional string, max 100). No server-side requirement that the slug must exist.
- **Resolves:** `getPublishedPackageBySlug(packageSlug)` in `lib/packages.ts`: `from("packages").select(...).eq("slug", slug).eq("published", true).maybeSingle()`. Returns `PackageRow | null`.
- **Insert:** Uses `package_id = pkg?.id ?? null` and `recommended_package_id = packageId`. So if the package is missing or unpublished, both are null and the insert is still valid (no FK violation: we are not inserting a non-existent package id).

So: **POST /api/leads does accept the slug and does resolve it when the package exists; it does not require the package to exist for the insert to succeed.**

---

## 4. What can cause the submit to “error”

Possible causes:

| Cause | Type | How it shows |
|-------|------|--------------|
| **Missing DB columns** | Deploy lag (DB) | Insert fails with Postgres error (e.g. column does not exist). API returns 500, frontend shows “We could not save your request” or “Something went wrong”. |
| **Missing / unpublished package** | Data (seed) | Package lookup returns null; insert still succeeds. So this **does not** by itself cause submit to fail. It can cause 404 on `/packages/essential-care-journey` or empty recommendation on proposal. |
| **Validation failure** | Backend | 400 + “Validation failed...”. Only if required fields invalid or honeypot/rate limit. |
| **Rate limit** | Backend | 429. Unlikely on first submit. |
| **RLS / permissions** | Deploy (DB) | If RLS on `leads` blocks the insert for the service role, insert could fail → 500. Current setup uses service role (bypasses RLS); only an env/config mistake would cause this. |
| **Network / CORS** | Client | “Network error” in UI; no 4xx/5xx from our API. |

The most likely cause on a **deployed dev** host is: **insert fails because the database is missing columns** that the current code sends (migrations not fully applied). That is **deploy lag (DB schema)**, not a bug in “package logic”.

---

## 5. Exact failing step (most likely)

**Step:** `supabase.from("leads").insert({ ... }).select("id").single()` in `app/api/leads/route.ts`.

**Reason:** The insert payload includes columns added in later migrations, for example:

- `package_id`, `recommended_package_slug`, `recommended_package_id` (0015, 0020)
- `specialist_ids`, `experience_ids` (0013)
- `selected_specialties`, `selected_experience_categories`, `selected_experience_ids`, `travel_companions`, `budget_range` (0017)
- UTM, `landing_path`, `referrer_url` (0004)

If the **deployed Supabase project** has not run migrations through **0020**, one or more of these columns do not exist → Postgres error → handler catches → **500** with generic “We could not save your request.”

So the **exact failing step** is: **lead insert** (DB error due to schema mismatch).

---

## 6. Deploy lag vs backend package logic

| Hypothesis | Verdict |
|------------|--------|
| **Deploy lag** | **Most likely.** DB schema on dev host is behind the code (migrations 0001–0020 not all applied), so insert fails with “column … does not exist” or similar. Alternatively, deployed **code** is behind main (e.g. old build without current error handling or schema assumptions). |
| **Backend package logic** | **Unlikely.** Package slug is optional; missing package yields `package_id = null`; insert is designed to succeed without a matching package. No validation or FK that requires `essential-care-journey` to exist. |

**Conclusion:** Treat as **deploy lag (DB and/or code)** until proven otherwise. Package logic (validation, lookup, null handling) is correct.

---

## 7. Confirm latest fixes on main and deployed host

- **Main:** Ensure the branch you consider “production” (e.g. `main`) has the current `app/api/leads/route.ts` (insert with all columns above), `lib/packages.ts` (`getPublishedPackageBySlug`), and migrations 0001–0020.
- **Deployed host:**  
  - **Code:** Build is from the same ref (e.g. last main deploy on Vercel). No old build that might use a different schema or error path.  
  - **DB:** Same Supabase project used by the deploy has **all migrations 0001–0020** applied (Supabase Dashboard → SQL Editor / Migration history).
- **Seed:** For the slug to resolve and for package pages to work, the three packages must exist and be published. Run `scripts/seed_marketplace_foundation.sql` (or the focused packages-only SQL from PRODUCTION_PACKAGE_SLUGS_FIX.md) on the **deployed** DB. Without seed, submit can still **succeed** (with null package_id); with seed, proposal and package URLs work as expected.

---

## 8. Minimal fix

### 8.1 Fix DB schema (required for insert to succeed)

1. **Apply all migrations** on the **deployed** Supabase project (dev host DB):  
   Run in order 0001 → 0020 (see `supabase/migrations/MIGRATION_ORDER.md`).  
   From repo: `npm run db:migrate` with that project linked, or run each migration script in the SQL Editor.
2. **Verify:** In SQL Editor, confirm `leads` has (among others): `package_id`, `recommended_package_slug`, `recommended_package_id`, `specialist_ids`, `experience_ids`, `selected_specialties`, `travel_companions`, `budget_range`, UTM/attribution columns.

### 8.2 Fix package resolution and UX (recommended)

3. **Seed the three packages** (including `essential-care-journey`) so that `getPublishedPackageBySlug("essential-care-journey")` returns a row and proposal/thank-you show the recommendation:  
   Run `scripts/seed_marketplace_foundation.sql` (or the “packages only” block in PRODUCTION_PACKAGE_SLUGS_FIX.md) on the **deployed** DB.  
   Verify: `select slug, name, published from public.packages where slug = 'essential-care-journey';` → one row, `published = true`.

### 8.3 Align deploy with main

4. **Redeploy** the dev host from the same ref as main (e.g. trigger a new Vercel deploy from `main`) so the running code and DB schema match.

### 8.4 Optional: surface real error in dev

5. In development, you can temporarily log or return the Supabase error in the 500 response (e.g. `supabase_message` or `supabase_code`) so the browser or logs show the exact Postgres error (e.g. “column recommended_package_id does not exist”). Do not expose detailed errors in production.

---

## 9. Summary

| Question | Answer |
|----------|--------|
| **Issue: deploy lag or backend package logic?** | **Deploy lag (DB schema and/or code/build).** Backend package logic is correct and does not require the package to exist. |
| **Exact failing step** | **Lead insert** in `POST /api/leads`: Postgres error most likely due to **missing columns** (migrations not applied on dev DB). |
| **Minimal fix** | 1) Apply migrations 0001–0020 on the deployed Supabase project. 2) Seed the three packages (e.g. `seed_marketplace_foundation.sql` or packages-only SQL). 3) Redeploy app from main so code and schema match. |

**References:** [PRODUCTION_PACKAGE_SLUGS_FIX.md](PRODUCTION_PACKAGE_SLUGS_FIX.md), [MIGRATION_ORDER.md](../supabase/migrations/MIGRATION_ORDER.md), [app/api/leads/route.ts](../app/api/leads/route.ts), [lib/packages.ts](../lib/packages.ts).
