# Login runtime diagnosis — Hard diagnosis

**Goal:** Find the exact runtime point where login fails in QA using minimal diagnostic logs.

---

## 1. Runtime flow audited

| Step | Path | What happens |
|------|------|--------------|
| 1 | **/login** | User signs in (password or OAuth). Password: client `signInWithPassword` → redirect to `/auth/callback`. OAuth: redirect to provider → back to `/auth/callback?code=...`. |
| 2 | **/auth/callback** | If `code`: exchange code for session, set cookies. If no `code`: read session via `getCurrentUser()` (cookies). Then ensure profile, set cookies on response, redirect by role. |
| 3 | **/api/auth/me** | Read session via `getCurrentUser()`, then profile via `getCurrentProfile()`. Return 200 + role/redirectPath or 401. |
| 4 | **/patient** | Server calls `requirePatient()` (session + profile); on throw, redirect to `/login?next=/patient`. |

---

## 2. Diagnostic logging added (minimal, temporary)

| Location | Log message | Meaning |
|----------|-------------|---------|
| **auth/callback** | `auth/callback: no code or no user from code, checking getCurrentUser` | Password login path or OAuth returned without user; checking cookies for session. |
| **auth/callback** | `auth/callback: getCurrentUser result` `{ hasUser: true/false }` | Whether the server saw a session in cookies when callback ran. |
| **auth/callback** | `auth/callback: no session or user` | No user after code exchange and/or getCurrentUser → redirect to login. |
| **auth/callback** | `auth/callback: code exchanged` `{ hasUser: true }` | OAuth code exchange succeeded. |
| **auth/callback** | `auth/callback: redirect` `{ role, targetPath }` | Callback succeeded; redirecting to dashboard. |
| **auth/me** | `auth/me: 401` `{ step: "noSession" \| "noProfileOrInactive", hasUser: true/false }` | 401 reason: no session in cookies vs user exists but no profile or inactive. |
| **auth/me** | `auth/me: 200` `{ role }` | Session and profile OK. |
| **patient** | `patient: requirePatient threw, redirecting to login` | /patient was hit but auth failed (no session or no profile/forbidden). |

---

## 3. How to interpret logs (exact failing step)

After one login attempt in QA, check **Vercel** (or server) logs for the request. Match the sequence:

1. **Session exists after login (client)?**  
   Not directly visible in server logs. If the next steps show the server never sees the user, the session exists only in the browser (e.g. cookies not sent or not set).

2. **Callback sees the user?**  
   - Look for **`auth/callback: getCurrentUser result`** `hasUser: true` (password login) or **`auth/callback: code exchanged`** `hasUser: true` (OAuth).  
   - If you see **`auth/callback: no session or user`** and before it **`getCurrentUser result`** `hasUser: false` → **failing step: server does not see session on callback** (cookies not sent, wrong domain, or proxy not setting cookies).

3. **/api/auth/me sees the user?**  
   - Look for **`auth/me: 200`** → yes.  
   - Look for **`auth/me: 401`** `step: "noSession"` → **failing step: server does not see session on auth/me** (same cookie/domain/proxy issue).  
   - **`auth/me: 401`** `step: "noProfileOrInactive"` `hasUser: true` → **failing step: profile missing or inactive** (DB: no row in `profiles` or `is_active = false`).

4. **Profile lookup succeeds?**  
   - In callback: **`auth/callback: profile select error`** or **`auth/callback: profile insert error`** or **`auth/callback: profile inactive`** → profile step failed.  
   - In auth/me: **`auth/me: 401`** `step: "noProfileOrInactive"` → profile missing or inactive.

5. **Redirect decision?**  
   - **`auth/callback: redirect`** `{ role, targetPath }` → callback decided correctly; if the user still lands on login, the redirect response or cookies may not be applied (e.g. client not following redirect or cookies not persisted).

---

## 4. Exact failing step — decision table

| What you see in logs | Failing step |
|----------------------|--------------|
| `auth/callback: getCurrentUser result` `hasUser: false` then `no session or user` | **Session not visible to server on callback** (cookies not sent to callback or not set by client/proxy). |
| `auth/callback: code exchanged` `hasUser: false` | OAuth code exchange did not return a user (rare). |
| `auth/callback: redirect` but user ends on /login | Redirect or cookie application issue (e.g. cookies not written on response, or client not storing them). |
| `auth/me: 401` `step: "noSession"` | **Session not visible to server on auth/me** (cookies not sent or not set). |
| `auth/me: 401` `step: "noProfileOrInactive"` | **Profile missing or inactive** (fix: ensure `profiles` row exists and `is_active = true` for that user). |
| `patient: requirePatient threw` | **/patient hit but auth failed** (same as auth/me: no session or no profile). |

---

## 5. Files changed (diagnostic only)

| File | Change |
|------|--------|
| **app/api/auth/me/route.ts** | On 401: call `getCurrentUser()` and log `step` (noSession vs noProfileOrInactive) and `hasUser`. On 200: log role. |
| **app/auth/callback/route.ts** | When no user from code: log "no code or no user from code, checking getCurrentUser" and "getCurrentUser result" with hasUser. |
| **app/patient/page.tsx** | On requirePatient throw: log "patient: requirePatient threw, redirecting to login". |
| **docs/LOGIN_RUNTIME_DIAGNOSIS.md** | This report. |

No refactor; no change to auth logic beyond adding logs.
