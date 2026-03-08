# Authentication and role-based access

Nebula Smile is a **curated private medical tourism platform**. Access is role-based; providers and specialists do not sign up publicly.

---

## Who can sign in

- **Admins** — Created by existing admins or via Supabase Dashboard. Full access to admin panel and operational data.
- **Coordinators** — Invited by admins. Access to coordinator dashboard (leads, bookings, consultations).
- **Provider managers** — Linked to a single provider (`profiles.provider_id`). See only that provider’s packages, specialists, experiences, and bookings.
- **Specialists** — Linked to a single specialist (`profiles.specialist_id`). See consultation requests and assigned items.
- **Patients** — Optional: can have an account to see their own assessments, bookings, and payments (matched by email). Legacy role `user` is treated as patient.

---

## Patient signup (optional)

- **Patients** can create an account at **`/signup`**. After Supabase Auth sign-up, **`POST /api/signup`** creates a profile with `role = 'patient'`. No public signup for other roles.

## Who cannot sign up publicly

- **Providers** and **specialists** are never created via public signup. Only admins create and approve them; admins (or a future invite flow) create the corresponding **profiles** with `role` and `provider_id` or `specialist_id`.
- **Coordinators** are created by admins (profile with `role = 'coordinator'`).

---

## Login flow

1. **Route:** `/login` (canonical). `/signin` and `/admin/login` redirect to `/login` with optional `?next=...`.
2. User enters email and password; Supabase Auth `signInWithPassword` is used.
3. After success, the client calls **`GET /api/auth/me`** to get `role` and `redirectPath`.
4. User is redirected by role:
   - `admin` → `/admin`
   - `coordinator` → `/coordinator`
   - `provider_manager` → `/provider`
   - `specialist` → `/specialist`
   - `patient` (or `user`) → `/patient`
5. If `?next=` was provided and the user has access, that path can be used instead (e.g. `/admin/login?next=/admin/providers` → after login, redirect to `/admin/providers`).

---

## Profile model (database)

Table **`public.profiles`** (extends `auth.users`):

| Column          | Type    | Description |
|-----------------|---------|-------------|
| `id`            | uuid    | PK, FK to `auth.users(id)` |
| `email`         | text    | Synced from auth |
| `full_name`     | text    | From auth or admin |
| `role`          | text    | `admin`, `coordinator`, `provider_manager`, `specialist`, `patient`, `user` |
| `provider_id`   | uuid    | Optional; set for `provider_manager` |
| `specialist_id` | uuid   | Optional; set for `specialist` |
| `is_active`     | boolean | If false, user cannot log in |
| `created_at`    | timestamptz | |
| `updated_at`    | timestamptz | |

Migration: **0011_profiles_roles_dashboards.sql** (additive).

---

## Server-side guards

Use in Server Components and Route Handlers. All throw on failure (Unauthorized or Forbidden).

| Helper | Allowed roles |
|--------|----------------|
| `requireAdmin()` | `admin` only |
| `requireCoordinator()` | `coordinator`, `admin` |
| `requireProviderManager()` | `provider_manager`, `admin` |
| `requireSpecialist()` | `specialist`, `admin` |
| `requirePatient()` | `patient`, `user`, `admin` |

- **`getCurrentProfile()`** — Returns `{ user, profile }` or `null` if not authenticated or inactive.
- **`getCurrentUser()`** — Returns Supabase User or null (no profile check).

Do not rely only on client-side route protection; every protected page or API must use these guards.

---

## Rollout strategy

1. **Phase 1 (done):** Migration 0011, extended profiles, role guards, `/login` and role redirect, dashboards for all five roles.
2. **Next:** Create users in Supabase Auth (Dashboard or invite flow); insert or update `profiles` with correct `role`, `provider_id`/`specialist_id` where needed.
3. **Optional:** Invite-by-email flow (magic link or temp password) that creates auth user + profile with role set by admin.
4. **Patient signup:** If desired, keep a minimal signup that creates a profile with `role = 'patient'`; do not add public signup for provider/specialist/coordinator.

See [DASHBOARD_ROLES.md](DASHBOARD_ROLES.md) for dashboard responsibilities by role.
