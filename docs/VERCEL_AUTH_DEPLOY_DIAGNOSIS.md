# Vercel auth deploy — Deployment risk diagnosis

**Date:** 2026-03-14  
**Sprint goal:** Audit auth-related deployment risk and identify why login may loop back to sign-in on the deployed QA host.

---

## 1. Likely deploy / runtime issue

The most probable causes, in order:

| # | Issue | Why it explains login loop |
|---|--------|----------------------------|
| **1** | **Missing or wrong-scope env vars in Vercel** | Proxy (`proxy.ts`) and auth route handlers need **four** Supabase vars. If any are missing for the **deployment scope** (Production or Preview) you use for QA, the proxy does not refresh the session, and/or `/auth/callback` or `/api/auth/me` throw (500). User then sees error or gets sent back to `/login`. |
| **2** | **Build error: “middleware and proxy”** | If the deployed branch ever had both `middleware.ts` and `proxy.ts`, the build fails with “Both middleware file and proxy file are detected”. The **last successful deploy** might be an older build that does not include recent auth fixes (cookies, redirect from `/login`). Redeploy from **current main** (with only `proxy.ts`, no root `middleware.ts`) is required. |
| **3** | **Supabase Redirect URLs** | If the QA host URL is not in Supabase **Authentication → URL Configuration → Redirect URLs**, OAuth or post-login redirects can fail or be rejected, leading to a redirect back to login. |

---

## 2. Exact files involved

| File | Role | Deployment risk |
|------|------|------------------|
| **`proxy.ts`** (root) | Next.js 16 entry for “middleware”; runs on every request. Calls `updateSession()`. | Must be the **only** root proxy/middleware file. Uses `process.env.NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If either is missing at runtime, `updateSession()` returns `NextResponse.next({ request })` without refreshing session or redirecting authenticated users away from `/login`. |
| **`lib/supabase/middleware.ts`** | Exports `updateSession()`. Uses `createServerClient` and reads request/response cookies. | No env at module load; reads `NEXT_PUBLIC_SUPABASE_*` inside the function. Same as above: missing env → no refresh, no redirect. |
| **`lib/auth.ts`** | `getAuthClient()` uses `await cookies()` and `NEXT_PUBLIC_SUPABASE_*`; `getCurrentProfile()` uses `getServerSupabase()`. | `getServerSupabase()` **throws** if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing → route handler can 500. Used by `/api/auth/me` and (indirectly) `/auth/callback`. |
| **`lib/supabase/server.ts`** | `getServerSupabase()` — service-role client. | Throws if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` missing. Any route that touches profile (e.g. callback, auth/me) will crash. |
| **`app/auth/callback/route.ts`** | Session resolution (code exchange or `getCurrentUser()`), profile ensure, redirect. | Needs `NEXT_PUBLIC_SUPABASE_*` for code exchange; needs `getServerSupabase()` for profile → needs **all four** Supabase env vars. On throw → 500 → user may be sent to error page or back to login. |
| **`app/api/auth/me/route.ts`** | Returns role/redirectPath from `getCurrentProfile()`. | Uses `getAuthClient()` (NEXT_PUBLIC_*) and `getServerSupabase()` (server vars). Missing server vars → throw → 500. |
| **`app/login/page.tsx`** | Client-only; no server env. | No deploy risk from env. |
| **`lib/supabase/browser.ts`** | Client-only; uses `NEXT_PUBLIC_*` (inlined at build). | No server-side deploy risk. |

**No `middleware.ts`** at project root (only `lib/supabase/middleware.ts` helper). If a root **`middleware.ts`** exists on the deployed branch, Next.js 16 build will fail with “use proxy only”.

---

## 3. What could fail at build

- **“Both middleware file and proxy file are detected”** — A root `middleware.ts` exists alongside `proxy.ts`. Remove `middleware.ts` and use only `proxy.ts`; redeploy.
- **Missing build-time env** — CI/Vercel build often injects placeholders for `NEXT_PUBLIC_*`. For Vercel, ensure the **same** project has the four Supabase vars for the environment (Production/Preview) you deploy to. Build can succeed even if runtime env is wrong for another scope.
- **Next.js version** — Repo uses Next **16.1.6** and the **proxy** convention. Vercel must use the same major/minor so `proxy.ts` is recognized.

---

## 4. What could fail at runtime

- **Proxy:** `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` missing or wrong for the deployment → proxy does not refresh session and does not redirect authenticated users from `/login`. Login can still “work” (cookies set by client) but the next navigation might not see a refreshed session if Supabase expects refreshed tokens.
- **Route handlers:** `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` missing → `getServerSupabase()` throws → `/api/auth/me` and `/auth/callback` can 500. User sees error or is sent back to login.
- **Cookies:** On a secure QA host (HTTPS), cookies set by `createBrowserClient` must be sent on the next request (SameSite, Path, Domain). If the QA domain is not the same as the one used in Supabase (e.g. Site URL / Redirect URLs), or cookies are not sent cross-origin as expected, the server may not see the session and returns 401 → login loop.

---

## 5. What could explain login looping after deploy

1. **500 on `/auth/callback` or `/api/auth/me`** (missing server env) → User finishes sign-in, hits callback or auth/me → server throws → 500 or error page → user retries from login.
2. **Proxy not refreshing session** (missing `NEXT_PUBLIC_*` for the deployment) → Session might be present in the request but not refreshed; downstream behavior can be inconsistent and look like a loop.
3. **Deploy is not from current main** — Build that succeeded is from an older commit (e.g. before auth fixes or with `middleware.ts` removed only later). Redeploy from **current main** so the running app matches the repo (proxy-only, cookie-based client, callback and auth/me logic).
4. **Supabase Redirect URLs** — QA host not allowlisted → redirect after login or OAuth fails → user lands back on login.

---

## 6. Exact manual checks to perform in Vercel

1. **Deployment**
   - **Deployments** tab: Confirm the **QA deployment** (Production or Preview) is from the **latest main** (or the branch that has only `proxy.ts` and no root `middleware.ts`).
   - Open the **build logs** for that deployment. Search for:
     - `middleware-to-proxy` or “Both middleware file and proxy file”
     - Any **build error** or failed step.
   - If the last successful deploy is old, trigger a **Redeploy** from current main (no code change).

2. **Environment variables**
   - **Settings → Environment Variables**.
   - For the **same environment** used by QA (e.g. **Preview** if QA is a preview URL, or **Production**):
     - `NEXT_PUBLIC_SUPABASE_URL` — must be set and equal to Supabase Project URL.
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — must be set (anon public key).
     - `SUPABASE_URL` — must be set (same URL as above).
     - `SUPABASE_SERVICE_ROLE_KEY` — must be set (service_role secret).
   - No typos (e.g. `SUPABASE_SERVICE_KEY` vs `SUPABASE_SERVICE_ROLE_KEY`).
   - If you use **Preview** for QA, all four must be defined for **Preview** (and optionally Production). After changing env, **redeploy** that environment.

3. **Runtime logs**
   - **Logs** or **Functions** for the QA deployment.
   - After reproducing “stuck on login”, look for:
     - **500** or unhandled exception on `/auth/callback` or `/api/auth/me`.
     - Messages such as “Supabase server config missing” or “getServerSupabase” — indicate missing server env.
   - If you have app logs: `auth/me: 401` or `auth/callback: no session or user` — then session is not seen (cookies or proxy env).

4. **Supabase (Auth)**
   - **Authentication → URL Configuration**:
     - **Site URL**: e.g. `https://<your-qa-host>.vercel.app` (or your custom QA domain).
     - **Redirect URLs**: Must include `https://<your-qa-host>.vercel.app/auth/callback` (and `http://localhost:3000/auth/callback` if you test locally).

---

## 7. Is a redeploy of current main enough?

| Situation | Redeploy only? |
|-----------|-----------------|
| Env vars are correct for the QA environment and Supabase Redirect URLs include QA host. | **Yes.** Redeploy from current main so the running app has proxy-only auth, cookie-based client, and latest callback/auth/me. Then test login again. |
| One or more of the four Supabase env vars are missing or wrong for the QA scope. | **No.** Fix env in Vercel (Settings → Environment Variables), then **redeploy** that environment so the new vars are applied. |
| Build is failing (e.g. “middleware and proxy”). | **No.** Ensure repo has **no** root `middleware.ts` and only `proxy.ts`. Then push and redeploy (or redeploy from current main). |
| Supabase Redirect URLs do not include the QA host. | **No.** Add the QA callback URL in Supabase, then retry. No redeploy needed for that change. |

**Summary:** Redeploy of current main is **likely enough** only if (1) the last deploy is not from current main, and (2) env and Supabase URLs are already correct. Otherwise, fix env and/or Supabase config first, then redeploy.

---

## 8. No code changes in this audit

No code was changed. This document is diagnostic only. If after applying the checks above login still loops, the next step is to inspect Vercel function logs and Supabase Auth logs for the specific request (e.g. 500 stack trace or “no session” in app logs).
