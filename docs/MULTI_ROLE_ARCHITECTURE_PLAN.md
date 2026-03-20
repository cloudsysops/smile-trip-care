# Multi-role architecture plan — MedVoyage Smile

Date: 2026-03-16  
Goal: Support multiple platform roles per real user (admin, patient, specialist, coordinator, provider_manager) with a safe, phased, and backwards-compatible design.

---

## 1. Why current `profiles.role` is insufficient

Today:

- `public.profiles.role` is a **single string** used to determine:
  - Access guards (e.g., `requireAdmin`, `requirePatient`).
  - Redirects (`getRedirectPathForRole`).
- This works for **one primary role per user**, but breaks down when:
  - A founder or internal operator is both **admin and patient**.
  - A clinician is both **specialist** and potentially a test/patient or coordinator.
  - A provider manager might also act as an admin or coordinator.

Problems:

- **No expressiveness for multi-role:** A user cannot be modelled as both `admin` and `patient` without manually changing `profiles.role`, which is lossy and dangerous.
- **No history or separation of concerns:** Role changes overwrite the previous role, making audit and analytics of roles impossible.
- **Tight coupling:** All guards and redirects depend on a single column, making future extensions (e.g. “internal-only” roles, feature flags by role) harder.

The platform needs:

- To model **all roles** a user can have.
- To let a user choose an **active context/role** without changing identity (same auth user).
- To keep existing single-role users working without any change.

---

## 2. Proposed schema (already partially present)

### 2.1 `public.profile_roles` table

Migration `0023_profile_roles.sql` already creates:

```sql
create table if not exists public.profile_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_roles_profile_id
  on public.profile_roles(profile_id);

create unique index if not exists uq_profile_roles_profile_role_active
  on public.profile_roles(profile_id, role)
  where is_active = true;
```

This matches the requested design:

- Each `profiles` row can have **multiple role assignments** in `profile_roles`.
- Uniqueness index ensures:
  - A profile cannot have **duplicate active** rows for the same role.
- `on delete cascade` ensures role rows are cleaned up when a profile is removed.

### 2.2 `public.profiles.active_role` column

Migration `0023_profile_roles.sql` also adds:

```sql
alter table public.profiles
  add column if not exists active_role text;
```

This is **not yet wired** but is the natural place to store:

- The **current active role** for a user (e.g. `"admin"` vs `"patient"`).
- A value that can be used by SSR/guards without changing `profiles.role` semantics.

---

## 3. Backward compatibility strategy

### 3.1 Keep `profiles.role` as the primary source (for now)

For compatibility and minimal risk:

- All existing logic (guards, redirects, RLS) continues to rely on:
  - `profiles.role` as the **primary role**.
  - `profiles.is_active` for activation.
- We **do not remove or ignore** `profiles.role` during the initial phases.

Implications:

- Existing single-role users remain unchanged.
- Existing tests and behaviors around `requireAdmin`, `requirePatient`, `getRedirectPathForRole` keep working.

### 3.2 Use `profile_roles` as an **augmenting source**, not a replacement (initially)

Near term:

- `profile_roles` is:
  - The canonical store of **all roles** a profile has (`admin`, `patient`, `specialist`, etc.).
  - A way to display and manage roles (admin-facing tools).
- `profiles.active_role` is:
  - An optional hint about the currently selected role.
  - If `active_role` is `NULL`, we fall back to `profiles.role`.

Future:

- Guards and redirects can gradually move from:
  - `profiles.role` → `"primary" from profile_roles` + `active_role`.
- RLS policies can be updated to incorporate either:
  - `profiles.role OR profile_roles(...)` conditions, or
  - a view that surfaces “effective role(s)”.

### 3.3 Phased guard migration

Phase-wise:

1. **Phase 0:** No guard changes; we just read `profile_roles` for diagnostics.
2. **Phase 1:** In **selected low-risk paths** (e.g. `/debug/roles`, internal admin tools), use `profile_roles` to show multiple roles and `active_role`.
3. **Phase 2:** Introduce a **role-aware context** in `lib/auth`:
   - `getEffectiveRolesForProfile(id)` (reads `profile_roles`).
   - `getActiveRole(profile)` that prioritizes:
     - `profiles.active_role` if set and present in `profile_roles`.
     - Else `profiles.role`.
4. **Phase 3:** Gradually change:
   - `getRedirectPathForRole` / dashboards to use `activeRole` instead of `profiles.role`.
   - `require*` helpers to consult `profile_roles` while keeping a fallback to `profiles.role` during transition.

At every step, tests ensure existing flows remain intact.

---

## 4. Role switch design (conceptual)

### 4.1 Available roles and active role

Given a `profiles` row (`id`, `role`, `active_role`):

- **Available roles** come from:

```sql
select role
from public.profile_roles
where profile_id = <profile_id> and is_active = true;
```

- **Active role resolution**:
  - If `profiles.active_role` IS NOT NULL and exists in `profile_roles` for that profile:
    - Active role = `profiles.active_role`.
  - Else:
    - Active role = `profiles.role` (backward-compatible).

### 4.2 UX: role switcher

High-level UX (later phase, not in this sprint):

- **Location:**
  - Header dropdown or global account menu (e.g. top-right avatar).
  - For admins/specialists/provider managers: show a list like:
    - Admin
    - Patient
    - Specialist
    - Provider manager
  - For normal patients: no switcher (only one role).

- **Behavior:**
  - Selecting a role:
    - Sends a POST to `/api/auth/active-role` or similar.
    - That route:
      - Validates the chosen role is in `profile_roles` for that user.
      - Updates `profiles.active_role` to the chosen role.
    - Frontend then:
      - Calls `/api/auth/me` (or similar) to get updated `redirectPath`.
      - Redirects to the correct dashboard (e.g. `/admin/overview`, `/patient`).

- **Persistence:**
  - Stored in `profiles.active_role` (server-authoritative).
  - Optionally mirrored in a cookie or localStorage for UI hints, but SSR should use the server field.

### 4.3 Redirect behavior under multi-role

Once wired:

- `auth/callback` and `/api/auth/me` will compute redirect using **active role**, not just `profiles.role`.
- Example:
  - User has roles: `admin`, `patient`.
  - `profiles.role = "patient"`, `profiles.active_role = "admin"`.
  - After login or role switch:
    - `getRedirectPathForRole("admin")` → `/admin/overview`.
    - `/api/auth/me` returns `{ role: "admin", redirectPath: "/admin/overview", ... }`.

---

## 5. Safe implementation scope for this sprint

Per sprint constraints, **this sprint only implements the foundation**, not full switching or guard rewrites.

Already present by migration `0023_profile_roles.sql`:

- `public.profile_roles` table with:
  - `id`, `profile_id`, `role`, `is_active`, `created_at`.
  - Index and unique constraint for active roles.
- `public.profiles.active_role` column (nullable).

This means **no new migration is needed**; the schema is in place.

**Foundation to implement (code-only):**

1. **Role service layer**
   - `lib/services/roles.service.ts` (planned):
     - `getProfileRoles(profileId)` → returns all active roles.
     - `getActiveRoleForProfile(profile)` → resolves active role with fallback to `profile.role`.
   - These will be used by future UI and guard upgrades.

2. **Internal diagnostics (optional)**
   - Extend `/debug/auth` or add `/debug/roles` (admin-only) to show:
     - Profile.
     - All assigned roles (`profile_roles`).
     - Active role (resolved).
   - **Read-only**; no role editing in this sprint.

3. **No guard rewrites yet**
   - `requireAdmin`, `requirePatient`, etc. continue to use `profiles.role`.
   - No RLS changes in this sprint.

This keeps the system stable while preparing the building blocks for true multi-role behavior.

---

## 6. Risk analysis

**Technical risks (current sprint)**

- Very low:
  - Schema is already present (migration 0023).
  - We only add services and optional diagnostics pages.
  - No existing guards or auth flows are changed.

**Future-phase risks**

- If guards are moved to rely on `profile_roles` and `active_role`:
  - Must ensure every profile has consistent `profile_roles` rows.
  - Need to avoid partially migrated users (e.g. missing roles in `profile_roles`).
  - Must review RLS policies that reference `profiles.role`.

**Mitigations**

- Keep `profiles.role` as canonical until:
  - A background migration populates `profile_roles` for all existing profiles.
  - Tests verify `profile_roles` and `active_role` behave as expected.
- Use `/debug/auth` and `/debug/roles` to verify multi-role behavior for test accounts before applying to all users.

---

## 7. Phased rollout plan

**Phase 0 — Foundation (this sprint)**

- Confirm `0023_profile_roles.sql` is applied (QA/prod).
- Implement `lib/services/roles.service.ts` to read roles and active role.
- Extend `/debug/auth` or add `/debug/roles` to show multi-role info (read-only).

**Phase 1 — Admin tooling**

- Add an **admin-only roles panel**:
  - List and manage roles per profile, writing to `profile_roles`.
  - Ensure `profiles.role` and `profile_roles` stay in sync for primary role.

**Phase 2 — Active role switching**

- Implement:
  - `/api/auth/active-role` route to set `profiles.active_role`.
  - UI role switcher in header (for multi-role users).
  - Update `/api/auth/me` and `/auth/callback` to prioritize `active_role` where set.

**Phase 3 — Guard and RLS evolution**

- Gradually update guards (`require*`) and RLS policies to:
  - Use roles from `profile_roles`.
  - Use `active_role` for dashboards and navigation.
  - Keep `profiles.role` as a fallback during transition.

Each phase is independently deployable and reversible, minimizing risk while enabling a multi-role-capable SaaS foundation.

# Multi-role architecture plan — MedVoyage Smile

**Date:** 2026-03-16  
**Goal:** Allow a single real user to hold multiple roles (admin, patient, specialist, coordinator, provider_manager) and switch active context safely, without breaking existing auth, Stripe, or dashboards.

---

## 1. Why `profiles.role` is no longer sufficient

### 1.1 Current model

- `public.profiles.role` is a **single text field** with values like:
  - `admin`, `coordinator`, `provider_manager`, `specialist`, `patient`, `user`.
- Application logic:
  - Guards: `requireAdmin`, `requireCoordinator`, `requireProviderManager`, `requireSpecialist`, `requirePatient` use this field.
  - Redirect: `getRedirectPathForRole(role)` sends:
    - `admin` → `/admin/overview`
    - `coordinator` → `/coordinator`
    - `provider_manager` → `/provider`
    - `specialist` → `/specialist`
    - `patient` / `user` → `/patient`
- DB helpers and RLS (`is_admin()`, `current_profile_role()`) look at `profiles.role`.

### 1.2 Limitations

- **Single role only:** A user can be exactly one of `admin` / `coordinator` / `provider_manager` / `specialist` / `patient` / `user`.
- **Real-world mismatch:**
  - A founder or internal team member may need:
    - `admin` for backoffice and QA.
    - `patient` to experience the flow end-to-end.
  - A clinician may be both:
    - `specialist` (for clinical dashboard).
    - `patient` (if they try the service as a user).
  - A coordinator may act as:
    - `coordinator` (ops).
    - `provider_manager` (for one or more providers).
- **Admin operations:** Changing `profiles.role` today is a **destructive switch**:
  - You lose the previous role semantics (e.g. admin → patient).
  - There is no audit trail of role changes.
- **No active context:** There is no concept of “I am logged in as Carlos, and right now I’m viewing as *patient* vs *specialist*”.

**Conclusion:** We need a **multi-role model** where:

- One profile id → many role assignments.
- The app can choose an **active role** per session / per UI context.
- Existing `profiles.role` continues to work until the migration is complete.

---

## 2. Proposed schema

### 2.1 New table: `public.profile_roles`

```sql
create table if not exists public.profile_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_roles_profile_id
  on public.profile_roles(profile_id);

create unique index if not exists uq_profile_roles_profile_role_active
  on public.profile_roles(profile_id, role)
  where is_active = true;
```

**Notes:**

- `profile_id` points to `public.profiles.id` (1:N).
- `role` should be constrained in application code (and eventually in DB) to the same set as `ProfileRole`.
- `is_active` lets us **soft-disable** a role without deleting rows (auditability).
- The unique partial index enforces:
  - A profile can have **at most one active row** for each role.

### 2.2 Optional addition: `profiles.active_role`

We propose an **optional** (phased) addition to `profiles`:

```sql
alter table public.profiles
  add column if not exists active_role text;
```

Semantics:

- `active_role` is the **currently selected UI context** for that user.
- It should always be one of the roles available in `profile_roles` for that profile (or null).
- Backward compatibility:
  - If `active_role` is null, fall back to existing `profiles.role` for guards and redirects.
  - When we start wiring the switcher, we’ll write `active_role` and have `getRedirectPathForRole` (or a new helper) prefer `active_role` when present.

We do **not** add check constraints or RLS changes around `active_role` in this sprint; we only introduce the column (if/when we apply this part).

---

## 3. Backward compatibility strategy

### 3.1 Keep `profiles.role` as the primary source (for now)

Short term:

- All existing guards (`requireAdmin`, `requirePatient`, etc.) and redirects (`getRedirectPathForRole`) continue using `profiles.role`.
- New table `profile_roles` is **additive**:
  - Initially populated from `profiles.role`.
  - Used only by new service APIs and debug panels.

### 3.2 Migration and seeding plan

1. **Migration (foundation):**
   - Add `profile_roles` with the schema above.
   - Optionally add `active_role` column on `profiles`.

2. **Backfill script / SQL (Phase 2–3):**
   - For every row in `profiles`:
     - Insert into `profile_roles` a row `(profile_id = profiles.id, role = profiles.role, is_active = true)`, **if not already present**.
   - If we introduce `active_role`:
     - Set `active_role = profiles.role` where null.

3. **Read path (Phase 3+):**
   - Introduce `getAvailableRoles(profileId)` and `getActiveRole(profile)` in a new service module.
   - Gradually update guards and redirect helpers to:
     - Prefer `active_role` (if present and allowed by `profile_roles`).
     - Otherwise fall back to `profiles.role`.

4. **Write path (Phase 4+):**
   - Add admin-only APIs to:
     - Assign/unassign roles (create/update `profile_roles` rows).
     - Change `active_role`.

5. **Deprecation (Phase 5+):**
   - Once all guards and redirects use the new service layer, consider:
     - Freezing direct writes to `profiles.role` (only keep for compatibility).
     - Optionally, setting `profiles.role` to a derived/single “primary” role or leaving it as “legacy”.

Throughout all phases:

- Existing single-role users continue to behave exactly as before:
  - Their `profiles.role` remains valid.
  - `profile_roles` just mirrors that role.

---

## 4. Phased rollout plan

### Phase 1 (this sprint) — Foundation

- **Schema:**
  - Add `public.profile_roles` with indexes and uniqueness constraint.
  - Optionally add `profiles.active_role` (no logic wired yet).
- **Service layer:**
  - `lib/services/profile-roles.service.ts` with:
    - `getProfileRoles(profileId)` → list of roles.
    - `getActiveRole(profile)` → returns:
      - `active_role` if set and present in `profile_roles`.
      - Otherwise `profiles.role`.
  - **No guard changes**; this is read-only support.
- **Internal panel:**
  - Extend `/debug/roles` (admin-only) to show:
    - Legacy `profiles.role`.
    - All rows in `profile_roles`.
    - Resolved active role (from helper).
  - **Read-only**; no UI to mutate roles yet.

### Phase 2 — Backfill and read-path pilot

- Backfill `profile_roles` from existing `profiles.role`.
- Populate `active_role` = `profiles.role` for all current users.
- Update:
  - `/debug/auth` to show active role resolution.
  - Possibly include active role in `/api/auth/me` (e.g. `activeRole` field).
- Still keep guards on `profiles.role`, but logs/tests validate that `getActiveRole` matches expectations.

### Phase 3 — Guard and redirect integration

- Introduce **new helpers** (or evolve existing ones carefully):
  - `getEffectiveRole(profile)` which prefers `active_role` but falls back to `profiles.role`.
  - Update:
    - `getRedirectPathForRole` to accept an **effective role**.
    - Guards to use `getEffectiveRole` internally.
- Ensure tests cover:
  - Users with both legacy-only (`profiles.role` only) and multi-role (`profile_roles` + active_role) configurations.

### Phase 4 — Role switch UI

- Implement a **role switcher** in:
  - `/admin` shell for internal/QA/admin users.
  - Possibly `/debug/auth` or `/debug/roles` for QA-only switching.
- When user selects a role:
  - Validate that role exists in `profile_roles`.
  - Update `profiles.active_role`.
  - Redirect to the corresponding dashboard.

### Phase 5 — Optional deprecation of `profiles.role` writes

- Prevent direct UI/API writes to `profiles.role` except for controlled migrations or compat updates.
- Ensure all new role assignments go through `profile_roles` + `active_role` APIs.

---

## 5. Risk analysis

### 5.1 Risks

- **Schema risk (medium):** Adding a new table is safe if migrations run correctly; uniqueness constraint must be correct to avoid blocking inserts.
- **Auth risk (low in Phase 1):** We are not changing guards or login flow in this sprint; only adding read-only infrastructure.
- **Complexity risk (medium):** Multi-role logic can get complex; we mitigate by:
  - Centralizing role resolution in a service.
  - Phasing changes and keeping `profiles.role` as fallback.

### 5.2 Mitigations

- Start with **read-only** service and debug UI.
- Keep `profiles.role` as the single source of truth for guards until Phase 3.
- Add tests that cover:
  - Legacy users (no `profile_roles`).
  - Multi-role users (when we start using the new table).

---

## 6. Migration strategy (this sprint)

**Scope for this sprint (safe foundation only):**

1. **Migration file:** `supabase/migrations/0023_profile_roles.sql`
   - Create `public.profile_roles` with:
     - `id uuid primary key default gen_random_uuid()`
     - `profile_id uuid not null references public.profiles(id) on delete cascade`
     - `role text not null`
     - `is_active boolean not null default true`
     - `created_at timestamptz not null default now()`
   - Index `idx_profile_roles_profile_id` and unique partial index `uq_profile_roles_profile_role_active`.
   - **No** backfill yet (done in later sprint).

2. **Optional:** Add `active_role` column to `public.profiles` in the same migration, but **do not** wire it yet.

3. **Service layer:** `lib/services/profile-roles.service.ts`

4. **Internal panel:** Extend `/debug/roles` to show roles from `profile_roles` and resolved active role, read-only.

5. **Verification:** `npm run verify` (lint, tests, build).

We will implement exactly these in this sprint and no guard/redirect changes.

---

## 7. Role switch design (conceptual)

### 7.1 Active role selection

- **Concept:** A user always has a single **active role** in the UI.
- When the user switches role:
  - We update `profiles.active_role`.
  - We redirect to the corresponding dashboard using `getRedirectPathForRole(effectiveRole)`.

### 7.2 UI location

- **Primary:** In a global user menu (e.g. top-right in admin shell):
  - Show current active role as a badge (e.g. “Admin”, “Patient”, “Specialist”).
  - Dropdown list of other available roles (from `profile_roles`).
  - When selecting one:
    - POST to an internal API (e.g. `/api/auth/active-role`) that:
      - Validates the role is in `profile_roles`.
      - Updates `profiles.active_role`.
    - Redirects to the new dashboard.

- **Secondary (QA-only):** `/debug/auth` or `/debug/roles` can also show available roles and active role for validation.

### 7.3 Persistence strategy

- Store active role in **DB** (`profiles.active_role`), not only in cookies or localStorage:
  - Survives across sessions/devices.
  - Compatible with SSR and RLS.

---

## 8. What will be implemented now vs deferred

### Implemented in this sprint (Phase 1)

- Schema:
  - `public.profile_roles` table + indexes + uniqueness constraint.
  - Optional `profiles.active_role` column (if included in migration).
- Service:
  - `lib/services/profile-roles.service.ts`:
    - `getProfileRoles(profileId)`
    - `getActiveRole(profile)`
- Internal panel:
  - Extend `/debug/roles` (admin-only) to list:
    - `profiles.role`
    - All roles from `profile_roles`
    - Resolved active role
  - **Read-only.**
- Verification:
  - `npm run verify`.

### Deferred to later sprints

- Backfill from `profiles.role` into `profile_roles`.
- Populate and wire `profiles.active_role`.
- Update guards and redirects to use effective role.
- Implement role switcher UI and active-role API.
- Potential RLS updates based on multi-role context.

---

## 9. Recommended next sprint for full role switching

**Next sprint (Phase 2–3):**

1. **Backfill & effective-role helper**
   - Backfill `profile_roles` from `profiles.role`.
   - Populate `active_role = profiles.role` where null.
   - Implement `getEffectiveRole(profile)` that:
     - Prefiere `active_role` cuando existe y está permitido.
     - Fallback a `profiles.role`.
   - Añadir un campo opcional `activeRole` a `/api/auth/me` para depuración.

2. **Pilot guard/redirect integration**
   - Actualizar `getRedirectPathForRole` o un wrapper a usar `getEffectiveRole`.
   - Ajustar una o dos rutas de dash (por ejemplo `/admin/overview` y `/patient`) para usar helpers nuevos, con tests que validen ambos casos (legacy + multi-role).

3. **Lint + tests**
   - Añadir tests unitarios para el servicio de roles y para el cálculo de active vs legacy role.

El sprint después se puede centrar en el **role switcher UI** y el API de `active_role`.*** End Patch```} />}]]:
