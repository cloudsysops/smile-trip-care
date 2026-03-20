# Deployment QA — CLI audit report

Generated from systematic CLI inspection. Use this to fix the assessment submit 500 on the canonical dev host.

---

## 1. Git + branch sanity

**Commands run:**
```bash
git branch --show-current
git status --short
git log --oneline -n 12
```

**Results:**
- **Current branch:** `feature/sprint-2-conversion-engine`
- **Uncommitted changes:** Yes. Modified: `.gitignore`, `STATUS.md`, `app/api/leads/route.ts`, `app/dental-implants-colombia/page.tsx`, `app/hollywood-smile-colombia/page.tsx`, `app/login/page.tsx`, `app/page.tsx`, `app/signup/page.tsx`, `app/veneers-colombia/page.tsx`, `package-lock.json`, `package.json`. Untracked: `.cursor/prompts/`, `app/auth/`, `docs/DEPLOY_QA_CLI_REPORT.md`, `docs/ENTERPRISE_READINESS_AUDIT.md`, `playwright.config.ts`.
- **Changed files that relate to assessment / leads API / auth callback / docs:**
  - **Leads API:** `app/api/leads/route.ts` (modified — diagnostic logging: step, table, supabase_hint).
  - **Docs:** `docs/DEPLOY_QA_CLI_REPORT.md` (untracked — this report).
- **Recent commits:** `de50ab3` fix(assessment) referrer_url + diagnostics, `0058181` fix(leads) server-side diagnostic logging for lead insert 500, then sprint-2 and visual authority.

---

## 2. Route/file audit

**Commands run:** `test -f <path>` for each required file.

**Files verified (all OK):**
- `app/page.tsx`
- `app/assessment/page.tsx`
- `app/assessment/AssessmentForm.tsx`
- `app/assessment/AssessmentWizard.tsx`
- `app/assessment/proposal/page.tsx`
- `app/api/leads/route.ts`
- `app/login/page.tsx`
- `app/signup/page.tsx`
- `app/auth/callback/route.ts`

**Compact app route tree (relevant routes):**
```
app/api/health/route.ts
app/api/health/ready/route.ts
app/api/leads/route.ts
app/api/stripe/checkout/route.ts
app/api/stripe/webhook/route.ts
app/assessment/page.tsx
app/assessment/proposal/page.tsx
app/auth/callback/route.ts
app/login/page.tsx
app/signup/page.tsx
app/page.tsx
... (admin, packages, etc.)
```

---

## 3. Submit path and redirect path (source evidence)

**Searches run:** `grep` for `/api/leads`, `handleSubmit`, `lead_id`, `recommended_package_slug`, `referrer_url` in `app/assessment/*.tsx`.

### Exact source-file evidence

| Topic | File | Line | Relevant code snippet |
|-------|------|------|------------------------|
| **fetch("/api/leads")** | AssessmentWizard.tsx | 119 | `const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });` |
| **Submit handler** | AssessmentWizard.tsx | 78 | `async function handleSubmit(e: React.FormEvent) {` |
| **Redirect to proposal** | AssessmentWizard.tsx | 148-150 | `const params = new URLSearchParams({ lead_id: leadId }); if (recommendedSlug) params.set("recommended_package_slug", recommendedSlug); router.push(\`/assessment/proposal?${params.toString()}\`);` |
| **lead_id from response** | AssessmentWizard.tsx | 145-146 | `const leadId = typeof resData.lead_id === "string" ? resData.lead_id : null; const recommendedSlug = typeof resData.recommended_package_slug === "string" ? resData.recommended_package_slug : "";` |
| **referrer_url (Wizard)** | AssessmentWizard.tsx | 82-92, 111 | `rawReferrer = document.referrer?.trim() \|\| ""`; only set `referrer_url` if `new URL(rawReferrer)` succeeds and length ≤ 2000; else `undefined`. Body includes `referrer_url`. |
| **referrer_url (Form)** | AssessmentForm.tsx | 23-34, 51 | Same pattern: valid URL or undefined. |
| **fetch + redirect (Form)** | AssessmentForm.tsx | 59, 71-76 | `fetch("/api/leads", ...)` then `router.push(\`/assessment/proposal?${params.toString()}\`)` with `lead_id` and optional `recommended_package_slug`. |

**Which form is used on /assessment:** `app/assessment/page.tsx` renders only `<AssessmentWizard ... />`. AssessmentForm is not mounted on the assessment page.

**Exact redirect URL built after success:** `/assessment/proposal?lead_id=<uuid>[&recommended_package_slug=<slug>]`

**Proposal page params:** `app/assessment/proposal/page.tsx` L66-69: `searchParams: Promise<{ lead_id?: string; recommended_package_slug?: string }>`, `const { lead_id, recommended_package_slug } = await searchParams;` — used for package lookup and lead context; page does not call `notFound()` or `redirect()`.

---

## 4. Backend insert path (POST /api/leads)

**File:** `app/api/leads/route.ts`.

| Step | Description | Critical or optional | Tables/columns | Can cause 500? |
|------|-------------|----------------------|----------------|----------------|
| 1 | `LeadCreateSchema.safeParse(body)` | Critical (validation) | — | No (returns 400) |
| 2 | Honeypot check `company_website` | Critical (early exit) | — | No (returns 200) |
| 3 | `checkRateLimit(ip)` | Critical | — | No (returns 429) |
| 4 | `getPublishedPackageBySlug(packageSlug)` | Critical (read) | packages | No (insert continues with null packageId) |
| 5 | `getServerSupabase()` | Critical | — | Yes if env missing (throws → catch → "Server error") |
| 6 | **`supabase.from("leads").insert({...}).select("id").single()`** | **Critical** | **Table: `leads`**. Columns: first_name, last_name, email, phone, country, package_slug, package_id, message, specialist_ids, experience_ids, selected_specialties, selected_experience_categories, selected_experience_ids, travel_companions, budget_range, utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_path, referrer_url, status, recommended_package_slug, recommended_package_id | **Yes — this is the step that returns "We could not save your request" (500) on deploy.** |
| 7 | `supabase.from("bookings").insert(...)` | Optional | Table: bookings | No (only log.warn; response already 201) |
| 8 | `enqueueLeadCreatedAutomationJobs(...)` | Optional (fire-and-forget) | automation queue | No (only log.error; response already 201) |

**Conclusion:** The **only step that can produce the observed 500** ("We could not save your request") is the **leads insert** (step 6). Optional steps 7 and 8 do not change the HTTP status.

---

## 5. Exact Supabase env vars used

**Searches run:** `grep` for `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE`, `SUPABASE_SERVICE_KEY` in `*.ts,*.tsx`.

### All Supabase env vars referenced in source

| Variable | File | Line | Purpose | Required by /api/leads? |
|----------|------|------|---------|-------------------------|
| **SUPABASE_URL** | lib/config/server.ts | 26 | Read from process.env into server config | **Yes** — getServerSupabase() uses it |
| **SUPABASE_SERVICE_ROLE_KEY** | lib/config/server.ts | 27 | Read from process.env into server config | **Yes** — getServerSupabase() uses it |
| **SUPABASE_URL** | lib/supabase/server.ts | 13, 16 | Check + createClient(url, key) | **Yes** |
| **SUPABASE_SERVICE_ROLE_KEY** | lib/supabase/server.ts | 13, 16 | Check + createClient(url, key) | **Yes** |
| NEXT_PUBLIC_SUPABASE_URL | lib/config/public.ts | 14 | Public config | No |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | lib/config/public.ts | 15 | Public config | No |
| NEXT_PUBLIC_SUPABASE_URL | lib/supabase/browser.ts | 14 | Browser client | No |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | lib/supabase/browser.ts | 15 | Browser client | No |
| NEXT_PUBLIC_SUPABASE_URL | lib/supabase/middleware.ts | 6 | Auth middleware | No |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | lib/supabase/middleware.ts | 7 | Auth middleware | No |
| NEXT_PUBLIC_SUPABASE_URL | lib/auth.ts | 31 | Auth client | No |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | lib/auth.ts | 32 | Auth client | No |
| SUPABASE_URL | app/api/health/ready/route.ts | 19 | Ready check | No (different route) |
| SUPABASE_SERVICE_ROLE_KEY | app/api/health/ready/route.ts | 20 | Ready check | No |

**Not found in repo:** `SUPABASE_SERVICE_KEY` (only `SUPABASE_SERVICE_ROLE_KEY` exists).

**Exact env vars required by /api/leads execution path:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 6. Server diagnostics

**Current state (app/api/leads/route.ts L84-94):** On lead insert failure, the handler already logs:
- `request_id`
- `step: "leads.insert"`
- `table: "leads"`
- `supabase_code`
- `supabase_message`
- `supabase_details`
- `supabase_hint` (if present on error object)

**Conclusion:** No code change needed. The current logs show the exact failing step and Supabase error internals. API response remains user-safe ("We could not save your request. Please try again." + request_id).

---

## 7. CLI verification result

**Command run:** `npm run verify`

- **Lint:** Passed (eslint .).
- **Tests:** 23 test files, 69 tests passed.
- **Build:** Next.js build completed successfully.
- **Routes in build output:** `/api/leads` (ƒ), `/assessment` (ƒ), `/assessment/proposal` (ƒ) all appear in the Route (app) list. Confirm with: `npm run verify 2>&1 | grep -E "api/leads|assessment"`.

---

## 8. Root-cause ranking (deploy 500)

Using CLI/source evidence. The observed deploy behavior: POST /api/leads returns 500 with body `{"error":"We could not save your request. Please try again.","request_id":"..."}`. That body is returned only when the **leads insert** returns an error (route.ts L84-97). So the failure is at the Supabase `leads` insert, not at validation, rate limit, or optional bookings/automation.

| # | Hypothesis | Likelihood | Evidence for | Evidence against | Next manual check |
|---|------------|------------|--------------|-------------------|-------------------|
| 1 | **Migrations not applied** on the dev Supabase project (missing table or columns) | **High** | Insert uses columns from multiple migrations (0001, 0004, 0013, 0015, 0017, 0020). If dev DB has only 0001, columns like `recommended_package_slug`, `recommended_package_id`, `package_id`, or array columns would be missing → Postgres error. | None from code. | In Supabase (dev project): Table Editor → `leads` → confirm columns exist. Or run migrations 0001–0020 in order. |
| 2 | **Wrong Supabase project** (Vercel env points to different project) | **High** | Different project may have no `leads` table or different schema. Same symptom as (1). | If URL/key were missing entirely, getServerSupabase() would throw and response would be generic "Server error", not "We could not save your request." So env is set. | In Vercel: confirm SUPABASE_URL matches the dev project’s Project URL. In that project: confirm `leads` table and schema. |
| 3 | **Missing or wrong env in Vercel** (typo, wrong scope) | **Medium** | Wrong key or URL could yield 401/403 or connection errors from Supabase, which could surface as insert error. Empty value would throw before insert. | "We could not save..." implies insert was attempted; client was created. | In Vercel: Settings → Environment Variables. Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the **Preview** (and Production if used) scope. Redeploy after change. |
| 4 | **FK or constraint violation** (e.g. package_id references packages) | **Medium** | Insert sends package_id; if packages table is empty or ID mismatch, FK could fail. | packageId can be null; then recommended_package_id and package_id are null. So FK only applies when user selected a package. | In Vercel logs: read supabase_message/supabase_code (e.g. 23503 = FK violation). In Supabase: confirm packages row exists for the slug if used. |
| 5 | **RLS / permission issue** | **Low** | Theoretically could block insert. | Server uses **service role** key; RLS is bypassed for service role in Supabase. | If logs show permission/RLS error, confirm the key is the **service_role** secret, not anon. |
| 6 | **Optional secondary insert (bookings) causes 500** | **None** | — | Code path: booking failure only triggers log.warn; 201 already returned after lead insert. | Not applicable. |
| 7 | **Payload/schema mismatch** (client sends wrong shape) | **Low** | Could cause validation error. | Validation failure returns 400 with "Validation failed...", not 500. Deploy 500 has "We could not save...", so validation passed. | Not the blocker for 500. |

---

## 9. Deployment-readiness checklist (final report)

### Current branch
`feature/sprint-2-conversion-engine`

### Files reviewed
- app/page.tsx, app/assessment/page.tsx, app/assessment/AssessmentForm.tsx, app/assessment/AssessmentWizard.tsx, app/assessment/proposal/page.tsx
- app/api/leads/route.ts
- lib/supabase/server.ts, lib/config/server.ts, lib/validation/lead.ts
- supabase/migrations (leads-related)

### Exact submit path
User on `/assessment` → AssessmentWizard.handleSubmit → `fetch("/api/leads", { method: "POST", body: JSON.stringify(body) })` with normalized referrer_url (valid URL or omitted).

### Exact redirect path
On 201: client reads resData.lead_id and resData.recommended_package_slug → `router.push("/assessment/proposal?lead_id=<id>&recommended_package_slug=<slug>")` (slug optional).

### Exact backend insert path
POST → validate → rate limit → package lookup → **getServerSupabase() → supabase.from("leads").insert({...}).select("id").single()** → on success: optional bookings insert (warn on fail) + fire-and-forget automation enqueue → return 201.

### Exact env vars required by /api/leads
- **SUPABASE_URL**
- **SUPABASE_SERVICE_ROLE_KEY**

### Ranked root cause hypotheses
See **Section 8** above.

### Exact files changed (this audit)
- **app/api/leads/route.ts** — Already contained improved diagnostic logging (step, table, supabase_code, message, details, hint). No further change required for this audit.
- **docs/DEPLOY_QA_CLI_REPORT.md** — This report (created/updated).

---

## Founder manual checklist (Vercel + Supabase)

### Which Vercel project to inspect
The project that serves the **canonical dev host** (e.g. `https://smile-transformation-platform-dev.vercel.app`), typically named like `smile-transformation-platform-dev`. In Vercel: select that project.

### Which environment variable names to verify
- **SUPABASE_URL** — must be the Supabase Project URL (e.g. `https://xxxx.supabase.co`).
- **SUPABASE_SERVICE_ROLE_KEY** — must be the **service_role** secret from the same project (Supabase → Project Settings → API → service_role → Reveal).

### Which environment scopes to verify
- **Preview** — used for branch/preview deployments. If the canonical dev host is a preview deployment, set (or fix) both variables for **Preview**.
- **Production** — used for production deployment. If you test on a production URL, set both for **Production**.
- **Development** — used only by `next dev` locally; not used by Vercel. No need to fix for deploy.

So: verify **Preview** and **Production** in Vercel so that the deployment you use (preview or prod) has the correct vars.

### Which Supabase table to inspect
- **Project:** The one whose URL and service_role key are in Vercel for that deployment.
- **Table:** `public.leads`.
- **Check:** Table exists; columns include at least: first_name, last_name, email, phone, country, package_slug, package_id, message, specialist_ids, experience_ids, selected_specialties, selected_experience_categories, selected_experience_ids, travel_companions, budget_range, utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_path, referrer_url, status, recommended_package_slug, recommended_package_id. (Apply migrations 0001 through 0020 if missing.)

### What to look for in Vercel function logs
1. Trigger a 500: submit assessment on the dev host (or `curl -X POST <origin>/api/leads` with valid JSON body).
2. In Vercel → **Logs** (or **Functions** → function for `POST /api/leads`), find that request.
3. Look for log line **"Lead insert failed"** with:
   - **request_id**
   - **step:** `"leads.insert"`
   - **table:** `"leads"`
   - **supabase_code** (e.g. 42P01 = undefined table, 42703 = undefined column, 23503 = FK violation)
   - **supabase_message**
   - **supabase_details**, **supabase_hint**
4. Use that code/message to decide: apply migrations, fix env, or fix schema/FK.

### Exact post-fix deploy test
1. **/assessment** — Open the assessment page on the dev host.
2. **Submit** — Fill and submit the evaluation form.
3. **/assessment/proposal** — Confirm redirect to `/assessment/proposal?lead_id=<uuid>[&recommended_package_slug=...]` and that the proposal page loads.
4. **/admin/leads** — Log in as admin, open `/admin/leads`, and confirm the new lead appears in the list.

---

## Recommended next step

1. Deploy the current branch (with diagnostic logging) to the canonical dev project.
2. Reproduce the 500 and read from Vercel logs the **supabase_code**, **supabase_message**, and **supabase_hint** for "Lead insert failed".
3. Apply the fix from the checklist (migrations and/or correct Supabase project and env for Preview/Production).
4. Re-run the exact post-fix deploy test above.

---

## Most likely blocker

**The deploy 500 is most likely caused by the dev Supabase project having an incomplete schema for `public.leads` (migrations not applied or wrong project linked in Vercel).** The handler reaches the insert step and Supabase/Postgres returns an error (e.g. missing table or column). Fix by ensuring the Vercel deployment’s SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY point to the intended dev project and that project has the `leads` table with all columns from migrations 0001–0020, then confirm in Vercel function logs with the "Lead insert failed" payload (supabase_code / supabase_message).
