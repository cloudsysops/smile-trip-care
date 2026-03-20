# Auth SSR session fix — Report

**Date:** 2026-03-14  
**Sprint goal:** Fix Supabase SSR session handling so authenticated users stop getting stuck on `/login` and `/api/auth/me` no longer returns 401 immediately after login.

---

## 1. Root cause

**Primary:** Session was not visible to the server because the **browser** client stored the session in **localStorage** (fixed in a previous sprint by switching to `createBrowserClient` from `@supabase/ssr`, which uses cookies).

**This sprint:** Two additional items were confirmed or fixed:

1. **Proxy (session refresh) is in use.** The app uses Next.js 16 **proxy** convention: `proxy.ts` at the project root exports `proxy(request)` and calls `updateSession(request)`. Next.js runs this on every request, so Supabase’s `createServerClient` in `updateSession` runs and refreshes the session / sets cookies on the response. There is no separate `middleware.ts` (Next.js 16 prefers `proxy.ts` only).

2. **Authenticated users could remain on `/login`.** If a user already had a valid session and opened `/login`, they were not redirected away until the client-side `useEffect` called `/api/auth/me`. The proxy now redirects authenticated users from `/login` to `/auth/callback`, which performs the role-based redirect in one server round-trip.

---

## 2. Files changed

| File | Change |
|------|--------|
| **`lib/supabase/middleware.ts`** | In `updateSession`: if pathname is `/login` and `user` exists, redirect to `/auth/callback` (with optional `?next=...`) so role-based redirect is applied server-side. |
| **`docs/AUTH_SSR_SESSION_FIX_REPORT.md`** | This report. |

**Not changed:** `proxy.ts` (already calls `updateSession`; no rename or export change). Browser client remains `createBrowserClient` in `lib/supabase/browser.ts`. Server auth remains `createServerClient` in `lib/auth.ts` and in `lib/supabase/middleware.ts`. No Stripe, webhook, or schema changes.

---

## 3. Was the issue browser client, server client, proxy, or login redirect?

| Layer | Status | Note |
|-------|--------|------|
| **Browser client** | Fixed earlier | `createBrowserClient` in `lib/supabase/browser.ts` so session is in cookies. |
| **Server client** | Correct | `getAuthClient()` and `createServerClient` with `cookies()` in `lib/auth.ts`; `updateSession` uses `createServerClient` with request/response cookies. |
| **Proxy (session refresh)** | In use | `proxy.ts` runs `updateSession()` on every request; no separate `middleware.ts` (Next 16 uses proxy only). |
| **Login redirect** | Fixed this sprint | Authenticated users hitting `/login` are now redirected to `/auth/callback` in the proxy, so they leave `/login` immediately and get role-based redirect. |

---

## 4. Login / session flow after fixes

1. **Password login**
   - User submits credentials on `/login`.
   - Client uses `getBrowserSupabase().auth.signInWithPassword()` (cookie-based `createBrowserClient`).
   - Session is written to **cookies** in the browser.
   - Client navigates to `/auth/callback` (with optional `?next=...`).
   - **Proxy** runs for `/auth/callback`: reads cookies, refreshes session, may set new cookies on response.
   - **Route handler** runs: `getCurrentUser()` sees session; ensures profile (creates patient if missing); redirects by role (admin → `/admin/overview`, patient → `/patient`, etc.).

2. **Already authenticated, user opens `/login`**
   - **Proxy** runs: sees session, pathname `/login` → redirect to `/auth/callback`.
   - **Callback** route: session + profile → redirect by role. User never stays on `/login`.

3. **Client-side check on `/login` (fallback)**
   - `useEffect` calls `GET /api/auth/me` with `credentials: "include"`.
   - If 200: client redirects to `next || data.redirectPath || "/patient"`.
   - This still works once the server sees the session (cookies + proxy refresh).

4. **Role → path**
   - admin → `/admin/overview`
   - user / patient → `/patient`
   - specialist → `/specialist`
   - coordinator → `/coordinator`
   - provider_manager → `/provider`

---

## 5. Verification

- **Lint:** `npm run lint` — pass.
- **Tests:** `npm run test` — 23 files, 69 tests pass.
- **Build:** `npm run build` — pass (no `middleware.ts`; only `proxy.ts` used).

Run full check: `npm run verify`.

---

## 6. If `/api/auth/me` still returns 401 in QA

1. **Confirm proxy runs:** Ensure `proxy.ts` is deployed and not disabled (Next.js 16 proxy convention).
2. **Cookies:** Same-site, HTTPS (if prod), and domain/path must allow the app to send and receive Supabase auth cookies.
3. **Profile:** User must have an active row in `profiles` (see `docs/AUTH_REDIRECT_FIX_REPORT.md` and `docs/AUTH_LOGIN_STUCK_DIAGNOSIS.md`).
4. **Logs:** Use existing logs: `auth/me: 401 (no session or no active profile)` and `auth/callback: no session or user` to see whether the failure is session vs profile.
