# QA/dev validation — diagnosis (no changes made)

**Deployed host tested:** https://smile-transformation-platform-dev.vercel.app

**Date:** 2026-03  
**Rules:** Evidence only; no code, schema, or env edits.

---

## 1. Current deployed host

| Item | Value |
|------|--------|
| Canonical dev host | https://smile-transformation-platform-dev.vercel.app |
| Vercel project (from logs) | cristians-projects-70afb32e/smile-transformation-platform-dev, branch main |

---

## 2. Local verification (read-only)

| Command | Result |
|--------|--------|
| `npm run verify` | **Passed** — Lint OK, 69 tests passed, Next.js build OK. |
| `npm run verify:schema` | **Passed** — "Remote migration state is in sync with local (or ahead)." |

**Note:** `verify:schema` runs against the **linked** Supabase project (see Section 6). It does **not** check the DB used by the **dev** Vercel deploy.

---

## 3. Assessment submit path (code inspection, no edits)

### 3.1 Frontend — `app/assessment/AssessmentWizard.tsx`

- **Request:** POST to `/api/leads` with JSON body (first_name, last_name, email, phone, country, package_slug, message, travel_companions, budget_range, selected_specialties, utm_*, **landing_path**, referrer_url, company_website).
- **Success (res.ok, e.g. 201):**
  - If `resData.lead_id` is a string → redirect to `/assessment/proposal?lead_id=...&recommended_package_slug=...`.
  - Else → redirect to `/thank-you`, set status idle.
- **Error (!res.ok):** set status `"error"`, show `resData.error` or `"Something went wrong. Please try again."` (no redirect).
- **Network/exception:** set status `"error"`, show `"Network error. Please try again."`.

### 3.2 Backend — `app/api/leads/route.ts`

- **Validation failure (400):** returns `"Validation failed. Check your name, email, and other fields."`
- **Honeypot (200):** returns `{ ok: true }`, no insert.
- **Rate limit (429):** returns `"Too many requests. Please try again later."`
- **Supabase insert error (500):** logs `Lead insert failed` with step `leads.insert`, table `leads`, `supabase_code`, `supabase_message`; returns `"We could not save your request. Please try again."`
- **Success (201):** returns `{ lead_id, recommended_package_slug?, request_id }`.

So when the **DB** rejects the insert (e.g. PGRST204 for missing column), the API returns **500** and the frontend shows the **red error**: **"We could not save your request. Please try again."**

---

## 4. Success vs error in code (summary)

| Scenario | HTTP | User sees |
|---------|------|-----------|
| Lead created | 201 | Redirect to `/assessment/proposal?lead_id=...` |
| 2xx but no lead_id (e.g. honeypot) | 200 | Redirect to `/thank-you` |
| Validation / bad body | 400 | Red: "Validation failed. Check your name, email, and other fields." |
| Rate limit | 429 | Red: "Too many requests. Please try again later." |
| **DB error (e.g. PGRST204)** | **500** | **Red: "We could not save your request. Please try again."** |
| Server exception | 500 | Red: "Server error" or generic message |
| Network/fetch failure | — | Red: "Network error. Please try again." |

---

## 5. Exact manual test order (for you to run)

Do these in order on **https://smile-transformation-platform-dev.vercel.app**:

1. **Open /assessment**  
   - Confirm the assessment form loads (no 5xx).

2. **Submit a valid form**  
   - Fill required fields (first name, last name, email) and any optional ones.  
   - Click submit.  
   - Observe:
     - **If success:** redirect to `/assessment/proposal?lead_id=...` or `/thank-you`.
     - **If failure:** red message e.g. "We could not save your request. Please try again."

3. **Check /admin/leads**  
   - (If you have admin access) Open `/admin/leads`.  
   - **If submit succeeded:** the new lead should appear.  
   - **If submit showed the red error:** the lead will **not** be there (insert failed).

4. **Inspect Vercel logs for /api/leads**  
   - Vercel Dashboard → Project (smile-transformation-platform-dev) → Logs.  
   - Filter or search for `POST /api/leads` (or `/api/leads`).  
   - Reproduce: submit the assessment again, then refresh logs.  
   - Look for:
     - **PGRST204** and/or message like **"Could not find the 'landing_path' column of 'leads' in the schema cache"** → **DB** (dev Supabase schema missing column).

5. **Identify exact backend error**  
   - From the log line for that request: note `supabase_code`, `supabase_message`, and any stack.  
   - PGRST204 = PostgREST schema cache does not list that column → migration not applied on the DB that **this** deploy uses.

---

## 6. CLI read-only checks (already run)

| Command | Result |
|--------|--------|
| `npx supabase migration list` | All 0001–0020 show as applied on **Remote**. |
| `vercel logs` | Fetched; recent entries are GETs; project = smile-transformation-platform-dev. |

**Important:** `supabase migration list` talks to the **linked** Supabase project. In this repo the linked project is **prod** (smile-prod), not the DB used by the **dev** Vercel deploy. So:

- **Prod DB (linked):** has migrations 0001–0020 → has `landing_path`.
- **Dev DB (used by dev.vercel.app):** not linked; state unknown. The observed PGRST204 indicates that **dev**’s DB is **missing** the `landing_path` column (or other columns from 0004+).

---

## 7. Output: failing layer, evidence, code change, next action

### What layer is failing?

**DB (Supabase used by the dev deploy).**

The backend and frontend behave as designed: the API tries to insert into `public.leads` including `landing_path`; PostgREST returns PGRST204 because that column is not in the schema cache for the **dev** Supabase project. The API then returns 500 and the frontend shows the red message.

### Exact evidence

- **Previously reported (and consistent with code):** Vercel logs for `POST /api/leads` on the **dev** deploy showed:
  - **PGRST204**  
  - **"Could not find the 'landing_path' column of 'leads' in the schema cache"**
- **Code path:** `app/api/leads/route.ts` inserts `landing_path` (and other columns from migration 0004+). If the DB does not have that column, Supabase/PostgREST returns that error.
- **Linked project:** Prod has 0001–0020 applied. Dev deploy uses a **different** Supabase project (via Vercel env vars); that project’s migration state is not visible from the linked CLI.

### Are code changes needed?

**No.** The application code and API contract are correct. The fix is to bring the **dev** Supabase database in line with the code (apply the same migrations that exist in the repo, at least through 0004).

### Smallest next safe action

1. **Identify the Supabase project used by the dev Vercel project**  
   (Vercel → Project → Settings → Environment Variables: `SUPABASE_URL` or similar; derive project ref or DB from that.)

2. **Apply migrations to that dev DB only**  
   - Either link the CLI to the **dev** project and run `npm run db:migrate`,  
   - Or run the SQL from `supabase/migrations/0004_leads_attribution.sql` (and any other missing migrations) in that project’s SQL Editor.

3. **Re-test** using the same manual steps (Section 5) and confirm no PGRST204 in Vercel logs and that the lead appears in `/admin/leads`.

No code, schema, or env changes are required on the app side; only the **dev** database schema needs to be updated.

---

**Reference:** `docs/BACKEND_SCHEMA_COMPATIBILITY_AUDIT.md`, `docs/QA_REMEDIATION_CHECKLIST.md`, `docs/DEV_QA_REMEDIATION_SPRINT_REPORT.md`.
