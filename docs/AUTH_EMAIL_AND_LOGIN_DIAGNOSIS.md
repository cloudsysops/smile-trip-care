# Auth: email verification and login — Diagnosis

**Date:** 2026-03-14  
**Sprint goal:** Diagnose why email/password users are not getting verification emails reliably and still cannot log in end-to-end in QA.

---

## 1. Root causes

### 1.1 Missing or unreliable verification email

| Cause | Explanation |
|-------|-------------|
| **Supabase “Confirm email” enabled, default SMTP** | When “Enable email confirmations” is on, Supabase sends the confirmation email. If the project uses the built-in (default) SMTP, emails can be rate-limited, go to spam, or fail for some providers. |
| **No custom SMTP** | For reliable delivery in QA/production, Supabase recommends configuring a custom SMTP (e.g. Resend, SendGrid, AWS SES) in **Authentication → Email Templates / SMTP**. |
| **Redirect URL not allowlisted** | The link in the email redirects to your app. If `emailRedirectTo` (or the URL Supabase uses) is not in **Authentication → URL Configuration → Redirect URLs**, the redirect can fail or be rejected. |
| **No `emailRedirectTo` in signUp** | The app was not passing `emailRedirectTo` on sign-up, so the confirmation link could land on a default or wrong URL. **Fixed in code:** signup now passes `emailRedirectTo: origin + '/auth/callback'`. |

### 1.2 Login failing even with correct password

| Cause | Explanation |
|-------|-------------|
| **Email not confirmed** | With “Confirm email” on, `signInWithPassword` returns an error (e.g. `email_not_confirmed` / “Email not confirmed”) until the user clicks the link. The UI showed a generic “Invalid email or password”, so users did not know they had to confirm. **Fixed in code:** login now shows a specific message when the error indicates unconfirmed email. |
| **No profile row** | After sign-up, if there was no session (e.g. confirmation required), `POST /api/signup` returned 401 and the profile was never created. The **auth callback** (`/auth/callback`) already creates a patient profile on first successful login when none exists. So once the user confirms and logs in, the callback creates the profile. The remaining failure was either (a) user never got the email, or (b) user did not know they had to confirm. |
| **SSR session not visible** | Previously the browser client used localStorage, so the server did not see the session after login. That was fixed with `createBrowserClient` (cookies) and proxy-based session refresh. If 401 persists after that, see §6 below. |

---

## 2. Code-side fixes (this sprint)

| File | Change |
|------|--------|
| **`app/signup/page.tsx`** | (1) Pass `emailRedirectTo: origin + '/auth/callback'` in `signUp` options so the confirmation link lands in the app. (2) If `signUp` succeeds but `data.session` is null (confirmation required), skip `POST /api/signup` and redirect to `/login?message=confirm_email&next=/patient`. (3) If `POST /api/signup` returns 401, redirect to `/login?message=confirm_email&next=/patient`. |
| **`app/login/page.tsx`** | (1) When `signInWithPassword` fails, detect “email not confirmed” (message contains “confirm” / “not confirmed” or `code === 'email_not_confirmed'`) and show: “Please confirm your email first. Check your inbox and spam folder, then try again.” (2) When URL has `?message=confirm_email`, show a green info box: “Check your email to confirm your account, then sign in below.” |

No changes to Stripe, webhook, Supabase Auth provider config, or schema.

---

## 3. Manual Supabase settings to verify

Do this in the **Supabase project** used by QA (Dashboard).

1. **Authentication → Providers → Email**
   - Check whether **“Confirm email”** is enabled or disabled.
   - If enabled: users must click the confirmation link before they can log in with password.

2. **Authentication → URL Configuration**
   - **Site URL:** set to your QA app origin (e.g. `https://your-qa-host.vercel.app`).
   - **Redirect URLs:** add:
     - `https://your-qa-host.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` if you test locally.

3. **Authentication → Email Templates** (optional)
   - Confirm “Confirm signup” template exists and, if you use custom SMTP, that it is used.

4. **Project Settings → Auth → SMTP** (recommended for reliable delivery)
   - If you want reliable verification emails, configure **Custom SMTP** (e.g. Resend, SendGrid, SES) and use it for auth emails. Default Supabase SMTP can be rate-limited or land in spam.

---

## 4. Manual steps to unblock a QA user today

Use these when a specific user cannot log in (e.g. no email received or already confirmed but still failing).

### Option A: Confirm the user’s email in Supabase

1. In Supabase Dashboard: **Authentication → Users**.
2. Find the user by email.
3. Open the user; if **Email confirmed** is empty or “No”, either:
   - Click **Send confirmation email** and ask the user to use that link, or
   - Manually confirm (if your Supabase version allows it), or run SQL below.

**SQL (run in SQL Editor) — confirm one user by email:**

```sql
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{email_verified}',
    'true'::jsonb,
    true
  )
WHERE email = 'user@example.com';  -- replace with actual email
```

### Option B: Ensure the user has a profile

If the user can log in (session works) but `/api/auth/me` or `/patient` still fails, they may be missing a `profiles` row.

1. In Supabase: **Table Editor → `profiles`**.
2. Find the user by `id` (same as **Authentication → Users** → user’s UUID). If missing, insert:

```sql
INSERT INTO public.profiles (id, email, full_name, role, is_active)
VALUES (
  'user-uuid-here',  -- from Authentication → Users
  'user@example.com',
  'Full Name',
  'patient',
  true
)
ON CONFLICT (id) DO NOTHING;
```

Or use **Authentication → Users** to copy the user `id`, then add a row in `profiles` with that `id`, `role = patient`, `is_active = true`.

### Option C: Resend confirmation email

From Supabase Dashboard: **Authentication → Users** → select user → **Send confirmation email** (if available). Ask the user to check inbox and spam and click the link.

---

## 5. Current flow summary

1. **Sign up (email/password)**  
   Client calls `signUp` with `emailRedirectTo: origin + '/auth/callback'`.  
   - If confirmation required: no session → redirect to `/login?message=confirm_email`.  
   - If confirmation disabled: session exists → `POST /api/signup` creates profile → redirect to `/login?next=/patient`.

2. **User clicks confirmation link**  
   Supabase redirects to `/auth/callback` (with token); callback exchanges code for session and redirects by role. Profile is created in callback if missing.

3. **Login (email/password)**  
   `signInWithPassword`; if error is “email not confirmed”, show the specific message. On success → redirect to `/auth/callback` → profile ensured → redirect by role.

4. **Profile creation**  
   Either via `POST /api/signup` (when there is a session right after sign-up) or in `/auth/callback` on first successful login when no profile exists.

---

## 6. If login still returns 401 after fixes

If the user has confirmed email and has a profile but `/api/auth/me` still returns 401:

1. **Cookies / SSR:** Ensure the app uses `createBrowserClient` (cookies) and that `proxy.ts` runs `updateSession` so the server sees the session (see `docs/AUTH_SSR_SESSION_FIX_REPORT.md`).
2. **Profile:** In Supabase, confirm a row in `profiles` for that user with `is_active = true`.
3. **Logs:** Check server logs for `auth/me: 401 (no session or no active profile)` and `auth/callback: no session or user` to see whether the failure is session vs profile.

---

## 7. Verification

Run:

```bash
npm run verify
```

Lint, tests, and build must pass.
