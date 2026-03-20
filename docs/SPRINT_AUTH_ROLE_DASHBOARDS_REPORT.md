# Sprint: AUTH + ROLE DASHBOARDS — Final report

**Sprint goal:** Authentication structure, role-based access, and dashboard foundations for admin, coordinator, provider_manager, specialist, and patient.

---

## 1. Files modified

| File | Change |
|------|--------|
| **lib/auth.ts** | Extended with `Profile`, `ProfileRole`, `getCurrentProfile()`, `getRedirectPathForRole()`, `roleRedirectRole()`, `requireCoordinator()`, `requireProviderManager()`, `requireSpecialist()`, `requirePatient()`; `requireAdmin()` now returns `{ user, profile }`. |
| **app/signin/page.tsx** | After login, calls `GET /api/auth/me` and redirects by role (or `next` param). |
| **app/admin/* (existing)** | No changes to admin page logic; redirects to `/admin/login` preserved (admin/login now redirects to `/login?next=...`). |

---

## 2. Migrations created

| Migration | Description |
|-----------|-------------|
| **0011_profiles_roles_dashboards.sql** | Additive. Adds to `profiles`: `provider_id`, `specialist_id`, `is_active`, `created_at`. Extends `role` check to `admin`, `coordinator`, `provider_manager`, `specialist`, `patient`, `user`. Adds DB helpers: `current_profile_role()`, `current_provider_id()`, `current_specialist_id()`. |

---

## 3. Auth changes made

- **Login:** Canonical route `/login` with email/password; after success, client calls `GET /api/auth/me` and redirects to `redirectPath` (or `next`).
- **Role-aware redirect:** admin → `/admin`, coordinator → `/coordinator`, provider_manager → `/provider`, specialist → `/specialist`, patient/user → `/patient`.
- **Admin login URL:** `/admin/login` redirects to `/login?next=...` so existing admin redirects keep working.
- **No public signup** for providers/specialists/coordinators; only admins create/invite and set role and optional `provider_id`/`specialist_id`.
- **Inactive users:** `getCurrentProfile()` returns null when `is_active = false`; `/api/auth/me` returns 401.

---

## 4. Dashboards created

| Route | Guard | Content |
|-------|--------|--------|
| **/admin** | (existing) `requireAdmin()` | Unchanged: overview, leads, providers, specialists, experiences, bookings, consultations, assets. |
| **/provider** | `requireProviderManager()` | Provider profile, packages, specialists, experiences, recent bookings (scoped by `profile.provider_id`). Empty state if no `provider_id`. |
| **/specialist** | `requireSpecialist()` | Specialist profile, consultation requests (scoped by `profile.specialist_id`). Empty state if no `specialist_id`. |
| **/coordinator** | `requireCoordinator()` | Active leads, bookings in progress, consultations needing follow-up. |
| **/patient** | `requirePatient()` | Assessments (leads by email), bookings, consultations, payments. |

---

## 5. Tests added

| File | Tests |
|------|--------|
| **tests/auth-role.test.ts** | `getRedirectPathForRole` returns correct paths for all roles; `roleRedirectRole` maps `user` to patient; `GET /api/auth/me` returns 401 when not authenticated; returns role and redirectPath when authenticated. |

Existing tests (providers-api, admin-api-validation, leads-api, health, etc.) remain green. **Total: 32 tests.**

---

## 6. Docs updated / created

| Doc | Action |
|-----|--------|
| **docs/AUTH_AND_ROLES.md** | **Created.** Who can sign in, who cannot sign up publicly, login flow, profile model, server guards, rollout. |
| **docs/DASHBOARD_ROLES.md** | **Created.** Dashboard responsibilities by role, data access layer, navigation/UX. |
| **docs/DATA_MODEL.md** | **Updated.** Profiles section extended (roles, provider_id, specialist_id, is_active); link to AUTH_AND_ROLES and DASHBOARD_ROLES. |
| **docs/ENGINEERING_HANDBOOK.md** | **Created.** Stack, auth/roles, data/APIs, migrations, quality, doc index. |
| **docs/SECURITY_COMPLIANCE.md** | **Created.** Curated access model, who can sign in, server-side enforcement, secrets, RLS, rollout. |
| **STATUS.md** | **Updated.** Auth + role dashboards (0011) row; migration list 0011; routes list includes `/login`, `/provider`, `/specialist`, `/coordinator`, `/patient`. |

---

## 7. Risks detected

- **Profile backfill:** Existing `profiles` rows have `role = 'user'` or `'admin'`; new columns `provider_id`, `specialist_id`, `is_active`, `created_at` are nullable or defaulted. No destructive change. Admins remain admins; legacy `user` is treated as patient for redirect.
- **Patient dashboard:** Data matched by `lead.email = profile.email`. If a patient has no account, they don’t see a dashboard; assessment flow is unchanged (public form → lead). No new public signup added.
- **Coordinator/Provider/Specialist:** No users exist yet with these roles; they must be created in Supabase (Auth + profiles) by an admin. Dashboards show empty or “not linked” until then.

---

## 8. Safe to merge?

**Yes.** Changes are additive:

- New migration 0011 is additive; existing profiles and RLS remain valid.
- Existing admin flows still use `requireAdmin()` and redirect to `/admin/login` (which now redirects to `/login`).
- New routes `/provider`, `/specialist`, `/coordinator`, `/patient` are protected by role guards; unauthenticated or wrong-role users are redirected to `/login`.
- No public provider/specialist signup added; no destructive refactors; lead/Stripe/health and current admin tests pass.

Recommendation: run `npm run db:migrate` after merge to apply 0011; then create test users (Supabase Dashboard or future invite flow) with the new roles and optional `provider_id`/`specialist_id`.

---

## 9. Recommended next sprint

- **Invite flow (optional):** Admin invites coordinator/provider manager/specialist by email (magic link or temp password), creating auth user + profile with role and optional `provider_id`/`specialist_id`.
- **RLS policies (optional):** Add role-based RLS policies using `current_profile_role()`, `current_provider_id()`, `current_specialist_id()` so database-level enforcement matches application guards.
- **Patient account (optional):** Minimal signup or “claim your journey” link that creates a profile with `role = 'patient'` and links existing leads by email.
- **Dashboard polish:** Deep links from coordinator dashboard to lead/booking detail; specialist “accept/decline” consultation actions; provider edit-own-profile (if desired).
