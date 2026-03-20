# QA admin access setup — Promote test admin user

Date: 2026-03-16  
Goal: Temporarily promote `cboteros1@gmail.com` to `admin` in the QA/dev environment so the founder can test admin dashboards and role-based redirects.

---

## 1. Role resolution (what happens with `admin`)

**Files inspected**

- `lib/auth.ts`
  - `getCurrentProfile()` reads `profiles.role` and `is_active` from `public.profiles`.
  - `getRedirectPathForRole(role)` resolves:
    - `admin` → `/admin/overview`
    - `coordinator` → `/coordinator`
    - `provider_manager` → `/provider`
    - `specialist` → `/specialist`
    - `patient` / `user` → `/patient`
  - `requireAdmin()` uses `getCurrentProfile()` and ensures `role === "admin"` for admin-only routes.
- `app/api/auth/me/route.ts`
  - Returns JSON:
    - `role: ctx.profile.role`
    - `redirectPath: getRedirectPathForRole(ctx.profile.role)`
  - On success for an admin user: `{ role: "admin", redirectPath: "/admin/overview", ... }`.
- `app/auth/callback/route.ts`
  - After login and profile check, computes:
    - `defaultPath = getRedirectPathForRole(role)`
    - `targetPath = next || defaultPath || "/patient"`
  - For `role = "admin"`, default path is `/admin/overview`.

**Conclusion:**  
When `profiles.role = 'admin'` and `is_active = true`, the app:

- Resolves `redirectPath` as `/admin/overview`.
- Allows access to `/admin` and `/admin/overview` via `requireAdmin`.

---

## 2. SQL to promote `cboteros1@gmail.com` to admin (QA/dev)

**Important:** Run this only in the **QA/dev** Supabase project backing the dev host (e.g. `smile-transformation-platform-dev`), not in production unless explicitly decided.

```sql
UPDATE public.profiles
SET role = 'admin',
    is_active = true
WHERE email = 'cboteros1@gmail.com';
```

**Notes**

- If there is no `profiles` row for that email yet, first ensure the user has logged in once so `profiles` is created.
- This change is reversible (see rollback below).

---

## 3. Rollback SQL (demote back to user)

```sql
UPDATE public.profiles
SET role = 'user'
WHERE email = 'cboteros1@gmail.com';
```

If you also want to disable access entirely:

```sql
UPDATE public.profiles
SET is_active = false
WHERE email = 'cboteros1@gmail.com';
```

---

## 4. Verification steps (founder / QA)

1. **Logout**
   - From the dev app (e.g. `https://smile-transformation-platform-dev.vercel.app`), log out if you are signed in.

2. **Login again as `cboteros1@gmail.com`**
   - Use the existing login flow at `/login` or `/signin`.

3. **Check `/api/auth/me`**
   - Open `/api/auth/me` in the browser (while logged in).
   - Expected JSON includes:
     - `"email": "cboteros1@gmail.com"`
     - `"role": "admin"`
     - `"redirectPath": "/admin/overview"`

4. **Open `/admin/overview`**
   - Navigate to `/admin/overview`.
   - You should see the admin overview dashboard without being redirected away.

5. **Open `/debug/roles`**
   - Navigate to `/debug/roles`.
   - You should see the internal roles panel with a table of profiles.
   - Confirm that the row for `cboteros1@gmail.com` shows:
     - `role = admin`
     - `is_active = true`

If any of these steps fail, re-check:

- That you ran the SQL against the correct Supabase project.
- That the user has a `profiles` row (login at least once before promotion).

---

## 5. Notes and safety

- This procedure is for **internal QA and founder testing** only.
- Every promotion/demotion should be traceable (log who ran the SQL and when).
- Do not create broad “admin for everyone” updates; always target a specific email.

# QA admin access setup — Promote test admin user

Date: 2026-03-16  
Goal: Temporarily promote `cboteros1@gmail.com` to `admin` in the QA environment so the founder can test admin dashboards and role-based redirects.

---

## 1. Role resolution (what happens with `admin`)

**Files inspected**

- `lib/auth.ts`
  - `getCurrentProfile()` reads `profiles.role` and `is_active` from `public.profiles`.
  - `getRedirectPathForRole(role)` resolves:
    - `admin` → `/admin/overview`
    - `coordinator` → `/coordinator`
    - `provider_manager` → `/provider`
    - `specialist` → `/specialist`
    - `patient` / `user` → `/patient`
  - `requireAdmin()` uses `getCurrentProfile()` and ensures `role === "admin"` for admin-only routes.
- `app/api/auth/me/route.ts`
  - Returns JSON:
    - `role: ctx.profile.role`
    - `redirectPath: getRedirectPathForRole(ctx.profile.role)`
  - On success for an admin user: `{ role: "admin", redirectPath: "/admin/overview", ... }`.
- `app/auth/callback/route.ts`
  - After login and profile check, computes:
    - `defaultPath = getRedirectPathForRole(role)`
    - `targetPath = next || defaultPath || "/patient"`
  - For `role = "admin"`, default path is `/admin/overview`.

**Conclusion:**  
When `profiles.role = 'admin'` and `is_active = true`, the app:

- Resolves `redirectPath` as `/admin/overview`.
- Allows access to `/admin` and `/admin/overview` via `requireAdmin`.

---

## 2. SQL to promote `cboteros1@gmail.com` to admin (QA)

Run this in the **Supabase SQL Editor** for the QA project.

> ⚠️ Make sure you are on the **QA** project, not production.

```sql
-- 1) Verify the auth user exists
select id, email
from auth.users
where email = 'cboteros1@gmail.com';

-- 2) Ensure a profile row exists (create if missing)
insert into public.profiles (id, email, full_name, role, is_active)
select
  u.id,
  u.email,
  coalesce((u.raw_user_meta_data->>'full_name'), u.email) as full_name,
  'patient' as role,
  true as is_active
from auth.users u
left join public.profiles p on p.id = u.id
where u.email = 'cboteros1@gmail.com'
  and p.id is null;

-- 3) Promote to admin and ensure active
update public.profiles
set role = 'admin',
    is_active = true
where email = 'cboteros1@gmail.com';

-- 4) Double-check resulting profile
select id, email, role, is_active
from public.profiles
where email = 'cboteros1@gmail.com';
```

This:

- Verifies the user exists in `auth.users`.
- Ensures a `profiles` row (inserting a patient profile if missing).
- Promotes that profile to `admin` and ensures `is_active = true`.

---

## 3. Verification checklist (after promotion)

Use the QA host, e.g. `https://smile-transformation-platform-dev.vercel.app`.

1. **Logout**
   - If currently logged in, sign out or clear session (close incognito window).

2. **Login again**
   - Go to:
     - `/login`
   - Sign in as:
     - `cboteros1@gmail.com`

3. **Check `/api/auth/me`**
   - Open in the same browser session:
     - `/api/auth/me`
   - Expected JSON:
     - `role: "admin"`
     - `redirectPath: "/admin/overview"`

4. **Access admin dashboard**
   - Visit:
     - `/admin`
   - It should redirect to `/admin/overview`.
   - Admin overview should load without 401/403.

If any step fails:

- Check Supabase `profiles` row:
  - `role` should be `admin`.
  - `is_active` should be `true`.
- Also check that you’re using the same QA host configured in `NEXT_PUBLIC_SITE_URL` and Supabase Redirect URLs.

---

## 4. Rollback SQL (demote back to patient)

To revert `cboteros1@gmail.com` to a normal patient account:

```sql
update public.profiles
set role = 'patient'
where email = 'cboteros1@gmail.com';

select id, email, role, is_active
from public.profiles
where email = 'cboteros1@gmail.com';
```

This keeps the profile and activity but removes admin privileges.

---

## 5. Notes and constraints

- No changes were made to:
  - Stripe logic or webhook logic.
  - Supabase Auth provider configuration.
  - Auth/session architecture or callback logic.
  - Database schema or migrations.
- This is a **minimal, reversible** role change via `public.profiles`, aligned with:
  - `lib/auth.ts` (role resolution and redirects).
  - `/api/auth/me` and `/auth/callback` behavior.

