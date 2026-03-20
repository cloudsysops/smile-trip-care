# Auth redirect fix report — Login no longer leaves users stuck

**Date:** 2026-03-13  
**Scope:** Login redirect so authenticated users do not stay on `/login` after successful sign-in. No Stripe, auth provider config, or schema changes.

---

## 1. Root cause

Two issues were identified:

### A. Post–password-login redirect relied on `/api/auth/me` and defaulted to `/admin`

- After `signInWithPassword` succeeded, the client called `GET /api/auth/me` and used `data.redirectPath` to redirect.
- **If the user had no profile row** (e.g. profile never created, or creation failed), `getCurrentProfile()` returns `null` → `/api/auth/me` returns **401**.
- The login page then fell back to `router.push(next || "/admin")`, so **patients** were sent to `/admin`, then saw Forbidden or were sent back to login → effectively stuck.
- There could also be a brief **session cookie propagation** delay, so the first request to `/api/auth/me` might see no session and return 401 even when the profile exists.

### B. Already-authenticated users could remain on `/login`

- If a user with a valid session and profile opened `/login` (e.g. bookmarked or back button), the page did not redirect them to their dashboard, so they stayed on the login form.

---

## 2. Files changed

| File | Change |
|------|--------|
| `app/login/page.tsx` | (1) After successful `signInWithPassword`, redirect to `/auth/callback` with optional `?next=...` instead of calling `/api/auth/me` and redirecting client-side. (2) Add a `useEffect` that on mount calls `/api/auth/me`; if 200, redirects to `next \|\| data.redirectPath \|\| "/patient"` so already-logged-in users leave `/login`. |

**Not changed:** `app/api/auth/me/route.ts`, `app/auth/callback/route.ts`, `lib/auth.ts` (behavior unchanged; they already support role-based redirect and profile creation in callback).

---

## 3. Redirect behavior after fix

### Email/password login (success)

1. User submits credentials; `signInWithPassword` succeeds.
2. Client navigates to **`/auth/callback`** (or `/auth/callback?next=...` if `next` was in the URL).
3. Server-side callback:
   - Reads session from cookies.
   - If no session → redirects to `/login` (with `next` preserved).
   - Loads or **creates** profile (patient if missing), then redirects to:
     - `next` if provided, else
     - role-based default: `/admin`, `/coordinator`, `/provider`, `/specialist`, or `/patient`.
4. User lands on the correct dashboard; no reliance on `/api/auth/me` immediately after login.

### Already authenticated (session + profile exist)

1. User opens `/login` (e.g. direct URL or back).
2. On mount, client requests `GET /api/auth/me` with credentials.
3. If **200**: redirect to `next || data.redirectPath || "/patient"` (e.g. patient → `/patient`, admin → `/admin`).
4. If **401**: user stays on login form (no session or no/inactive profile).

### OAuth (Google)

- Unchanged: Google flow already redirects to `/auth/callback` with `redirectTo`, and the callback ensures profile and redirects by role.

---

## 4. Missing profile handling

- **In callback:** If the user has a session but no profile row, `/auth/callback` creates a **patient** profile and then redirects by role (patient → `/patient`). So users are not stuck on login when the profile was missing.
- **In `/api/auth/me`:** Still returns 401 when there is no profile or inactive profile; the login page uses this only to redirect *away* from `/login` when the user is already logged in with a valid profile.

---

## 5. Manual Supabase steps still required

### 5.1 Quick diagnosis (when login “succeeds” but user stays on /login)

1. **Confirm the user exists in Auth**  
   Supabase → **Authentication → Users** → copy the user’s **UUID** and note their email.

2. **Confirm the profile exists**  
   In **SQL Editor** run:
   ```sql
   select id, email, role, is_active from public.profiles where id = 'PEGA_EL_UUID';
   ```
   - If **no row**: the app has no role to redirect to. Create/repair the profile (see §5.2).
   - If **row exists** with `role` and `is_active = true`: session or redirect is the issue; try step 3.

3. **Check session and redirect**
   - After logging in, open in the same browser:  
     `https://<tu-host>/api/auth/me`  
     - If it returns JSON with `role` and `redirectPath`: session is OK; the problem is only client redirect (should be fixed by the login/callback changes).
   - Then open:  
     `https://<tu-host>/patient`  
     - If it **loads the dashboard**: session + profile are OK; the fix ensures `/login` will redirect next time.
     - If it **sends you back to login**: session not persisted or profile still missing/inactive.

### 5.2 Fix existing user: ensure profile exists

If the user exists in **Authentication → Users** but has **no row in `profiles`** (or wrong role), run in **SQL Editor** (replace UUID and email):

```sql
insert into public.profiles (id, email, role, is_active)
values (
  'PEGA_AQUI_EL_UUID',
  'TU_EMAIL@gmail.com',
  'patient',
  true
)
on conflict (id) do update
set email = excluded.email,
    role = excluded.role,
    is_active = excluded.is_active;
```

Then try opening **`/patient`** directly. If it loads, the problem was the missing or wrong profile.

### 5.3 Solution for future users: trigger that creates profile on signup

The repo already defines a trigger in **`supabase/migrations/0001_init.sql`** that creates a profile on `auth.users` insert (role `user`, which the app treats as patient for redirects). Ensure that migration has been applied to your Supabase project.

If you need to add or repair this trigger manually (e.g. project created without running migrations), run in **SQL Editor**:

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    'patient',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Note: The existing migration `0001_init.sql` uses `role = 'user'`; the app maps `user` → patient for redirects. The SQL above uses `role = 'patient'` so new users are explicitly patients; both work with the current app.

### 5.4 Other checks

- **Ensure `profiles` table** exists with columns: `id`, `email`, `full_name`, `role`, `is_active`, etc. (see migrations).
- **Google OAuth:** Configure redirect URLs in Supabase (e.g. `https://<your-host>/auth/callback`) and Site URL.
- **Email confirmation:** If enabled, the user must confirm before sign-in succeeds; redirect behavior is unchanged.

---

## 6. Verification

- `npm run verify`: run locally to confirm lint, tests, and build pass.
- **Manual checks:**
  1. Sign in with email/password (user with profile) → should land on role dashboard (e.g. `/patient` for patient).
  2. Sign in with email/password (user without profile) → should land on `/patient` after callback creates profile.
  3. Open `/login` while already signed in → should redirect to your dashboard.
  4. Sign in with Google → should still land on the correct dashboard via `/auth/callback`.
