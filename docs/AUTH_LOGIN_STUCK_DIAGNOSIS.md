# Auth login stuck — Diagnosis and fix

**Date:** 2026-03-13  
**Symptom:** User signs in successfully (no visible auth error) but the app stays on `/login` in QA.

---

## 1. Root cause

**Primary cause: session was not in cookies.**

- The **browser** Supabase client was created with `createClient()` from `@supabase/supabase-js`, which stores the session in **localStorage** by default.
- After login, the app redirects to **`/auth/callback`** (or the client checks **`/api/auth/me`**). Those run **on the server**, which reads the session from **cookies** via `getAuthClient()` / `cookies()`.
- The server never sees localStorage, so it saw no session → returned 401 or redirected back to `/login` → user appeared stuck.

**Secondary:** Admin redirect default was `/admin`; it is now `/admin/overview` for consistency.

---

## 2. Files changed

| File | Change |
|------|--------|
| **`lib/supabase/browser.ts`** | Replaced `createClient` (supabase-js) with **`createBrowserClient`** (`@supabase/ssr`). The session is now stored in **cookies**, so the server sees it after redirect. |
| **`lib/auth.ts`** | **`getRedirectPathForRole`**: admin redirect path changed from `/admin` to **`/admin/overview`**. |
| **`app/auth/callback/route.ts`** | Added minimal diagnostic logging: no session, profile select/insert error, inactive profile, and successful redirect (role + targetPath). No PII. |
| **`app/api/auth/me/route.ts`** | Added minimal diagnostic logging when returning 401: `auth/me: 401 (no session or no active profile)`. |

**Not changed:** Stripe, webhook, Supabase Auth config, schema, middleware. Middleware already uses `createServerClient` and refreshes session; the fix was making the browser client cookie-based.

---

## 3. What was the issue: session, profile, callback, or login-page redirect?

| Layer | Issue? | Fix |
|-------|--------|-----|
| **Session cookie** | **Yes.** Browser stored session in localStorage; server reads cookies. Server never saw the session after login. | Use `createBrowserClient` in the browser so session is in cookies. |
| **Profile** | No code bug. If profile was missing, callback already creates it (patient). Remaining risk is DB/trigger not applied in QA. | None; doc and manual steps cover ensuring profile exists. |
| **Callback redirect** | No. Callback logic was correct; it failed only because `getCurrentUser()` returned null (no session in cookies). | Fixed by cookie-based browser client. |
| **Login-page redirect** | No. Login already redirected to `/auth/callback` after password login and redirected away when `/api/auth/me` returned 200. Both failed when server had no session. | Fixed by same browser client change. |

---

## 4. Redirect behavior after fix

- **Email/password login:** Client calls `signInWithPassword` → session is written to **cookies** by `createBrowserClient` → client navigates to `/auth/callback` → server reads session from cookies → ensures profile → redirects by role.
- **Already authenticated:** Client requests `/api/auth/me` (with cookies) → server returns 200 with `redirectPath` → client redirects to `next || redirectPath || "/patient"`.
- **Role → path:** admin → `/admin/overview`, patient/user → `/patient`, specialist → `/specialist`, coordinator → `/coordinator`, provider → `/provider`.

---

## 5. Manual Supabase steps still required

- **Ensure `profiles` exists** and that the trigger (or migration) that creates a profile on `auth.users` insert is applied in QA. If a user exists in Auth but has no row in `profiles`, create it manually (see `docs/AUTH_REDIRECT_FIX_REPORT.md` §5.2).
- **Google OAuth:** Redirect URLs in Supabase must include `https://<qa-host>/auth/callback` (and Site URL if used). No code change for this.

---

## 6. Diagnostic logging

- **`/auth/callback`:** Logs `auth/callback: no session or user` when `getCurrentUser()` returns null; `auth/callback: profile select error` / `profile insert error` when DB fails; `auth/callback: profile inactive` when profile exists but is inactive; `auth/callback: redirect` with role and targetPath on success.
- **`/api/auth/me`:** Logs `auth/me: 401 (no session or no active profile)` when returning 401.

Use these in QA (e.g. Vercel logs) to confirm whether the failure is “no session” vs “profile error” vs “inactive profile.”

---

## 7. Verification

- Run **`npm run verify`** (lint, tests, build). All must pass.
- **Manual in QA:** Sign in with email/password or Google → should land on the correct dashboard (e.g. `/patient` or `/admin/overview`). If not, check Vercel logs for the diagnostic messages above.
