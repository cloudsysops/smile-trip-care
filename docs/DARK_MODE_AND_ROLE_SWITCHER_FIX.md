# Dark Mode & Role Switcher Fix

## What was wrong
- Some authenticated pages (notably `/patient`) were still rendering with light-only styling.
- Admin and other dashboard areas did not consistently show a visible role switcher, so founder testing across roles was slow.
- The platform had an `active_role` foundation, but it was not consistently enforced across the guard/redirect logic.

## What is fixed
- Global dark mode is enforced in the major dashboards we updated:
  - `/patient`
  - `/host`
  - `/specialist`
  - `/admin/overview`
  - plus `/admin/*` via the shared `AdminShell` wrapper
- A visible `RoleSwitcher` is now mounted in the top header:
  - Patient/Host/Specialist: via `AuthDashboardHeader`
  - Admin: via `AdminShell` (shared admin header)
- Guards and post-login redirects now use **effective role resolution**:
  - If `profiles.active_role` exists and matches an assigned role in `profile_roles`, that role is used
  - Otherwise we fall back to `profiles.role`, then (if needed) to the first assigned role

## Where the RoleSwitcher is mounted
- `app/components/dashboard/AuthDashboardHeader.tsx` (used by `/patient`, `/host`, `/specialist`, `/admin/overview`)
- `app/admin/_components/AdminShell.tsx` (used by most `/admin/*` pages)

## How `active_role` works
- `profile_roles` is the source of truth for which roles a profile is allowed to activate (and which are currently `is_active = true`).
- `profiles.active_role` is the chosen “active context”.
- Endpoint to switch:
  - `POST /api/auth/active-role` with `{ "role": "<targetRole>" }`
  - Response includes `{ redirectPath }` used by the UI.

## Local testing checklist
1. Ensure the user has rows in `public.profile_roles` for:
   - `patient`, `host`, `specialist`, `admin`
2. Set `public.profiles.active_role` to one of them.
3. Visit any dashboard page (example: `/patient`) and confirm the `RoleSwitcher` appears.
4. Change role and verify redirection + access:
   - `/patient`, `/host`, `/specialist`, `/admin/overview`
5. Re-login (for OAuth) and confirm redirects use effective role.

