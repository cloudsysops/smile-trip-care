# Vercel deploy unblock — Report

**Date:** 2026-03-15  
**Sprint goal:** Unblock the deployed QA environment by fixing the Vercel build failure and restoring end-to-end auth + assessment functionality.

---

## 1. Root cause of the Vercel build failure

**Type error at build time:**

```
Module "@supabase/ssr" has no exported member 'SupabaseClient'
```

- **File:** `lib/supabase/browser.ts`
- **Cause:** The code imported `SupabaseClient` from `@supabase/ssr`. The package `@supabase/ssr` does **not** export `SupabaseClient`; that type is provided by `@supabase/supabase-js`. Next.js (and Vercel) run TypeScript during `next build`, so the invalid import caused the build to fail and the deploy to never complete. QA kept serving an older (possibly broken) deployment.

---

## 2. Exact file(s) changed

| File | Change |
|------|--------|
| **`lib/supabase/browser.ts`** | Fixed the type import only. No change to function names or behavior. |

---

## 3. Exact fix applied in lib/supabase/browser.ts

**Before (broken):**
```ts
import { createBrowserClient, type SupabaseClient } from "@supabase/ssr";
```

**After (fixed):**
```ts
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
```

- `createBrowserClient` remains from `@supabase/ssr` (correct for SSR/cookies).
- `SupabaseClient` type is now imported from `@supabase/supabase-js` (where it is defined).
- Function `getBrowserSupabase()` and all other behavior are unchanged.

---

## 4. Verify result

Run locally:

```bash
rm -f .next/lock
npm run verify
```

**Result:**

- **Lint:** Passed
- **Tests:** 23 files, 69 tests passed
- **Build:** `next build` completed successfully (TypeScript, static generation, proxy listed)

The repo is **ready for a new Vercel deploy** from current `main` (with this fix already committed).

---

## 5. What must be checked manually in Vercel after push

1. **Deployments:** Confirm the **latest** deploy from `main` is **Ready** (build succeeded). If it was failing before, a new push triggers a new build; wait until status is Ready.
2. **Environment variables:** In the Vercel project, for the environment that serves QA (Production or Preview), verify these four exist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`  
   If you add or change any, trigger a **Redeploy**.
3. **Supabase URL configuration:** In Supabase Dashboard → Authentication → URL Configuration:
   - **Site URL:** Set to the QA host (e.g. `https://smile-transformation-platform-dev.vercel.app`).
   - **Redirect URLs:** Include at least:
     - `https://smile-transformation-platform-dev.vercel.app/**`
     - `https://smile-transformation-platform-dev.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for local dev)
4. **QA database — lead attribution columns:** If `/assessment` or POST `/api/leads` failed with `PGRST204` (e.g. `landing_path` not found), run in Supabase SQL Editor (project used by QA):

   ```sql
   alter table public.leads add column if not exists landing_path text;
   alter table public.leads add column if not exists referrer_url text;
   alter table public.leads add column if not exists utm_source text;
   alter table public.leads add column if not exists utm_medium text;
   alter table public.leads add column if not exists utm_campaign text;
   alter table public.leads add column if not exists utm_term text;
   alter table public.leads add column if not exists utm_content text;
   ```

5. **Re-test on QA host:**
   - **/login** — Sign in with Google or email/password; should not loop.
   - **/api/auth/me** — After login, should return `role` and `redirectPath` (not Unauthorized).
   - **/patient** — After login as patient, should show dashboard (not redirect to sign in).
   - **/assessment** — Submit one; should succeed and create a lead.
   - **/admin/leads** — New lead from assessment should appear (admin login required).

---

## 6. Summary

| Item | Status |
|------|--------|
| **Root cause** | Invalid import: `SupabaseClient` from `@supabase/ssr` (not exported there). |
| **Fix** | Import `SupabaseClient` from `@supabase/supabase-js` in `lib/supabase/browser.ts`. |
| **Verify** | Lint pass, 69 tests pass, `next build` pass. |
| **Repo ready for deploy** | Yes. Push to `main` triggers Vercel; ensure deploy reaches Ready and run manual checks above. |
