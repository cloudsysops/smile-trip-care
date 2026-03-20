# Engineering handbook

Short reference for Nebula Smile platform development.

---

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind**
- **Supabase** (Auth, Postgres, RLS, Storage)
- **Stripe** (checkout, webhook)
- **Vercel** (deploy)

---

## Auth and roles

- **Curated private access:** No public signup for providers or specialists. Only admins create/invite users and set `profiles.role`, `provider_id`, `specialist_id`.
- **Login:** `/login`; role-aware redirect via `GET /api/auth/me` (admin → `/admin`, coordinator → `/coordinator`, provider_manager → `/provider`, specialist → `/specialist`, patient → `/patient`).
- **Guards (server-side):** `requireAdmin()`, `requireCoordinator()`, `requireProviderManager()`, `requireSpecialist()`, `requirePatient()`, `getCurrentProfile()`. Use in every protected page and API; do not rely only on client-side checks.
- See [AUTH_AND_ROLES.md](AUTH_AND_ROLES.md) and [DASHBOARD_ROLES.md](DASHBOARD_ROLES.md).

---

## Data and APIs

- **Server data:** Use `getServerSupabase()` (service role) in API routes and Server Components. Never expose service role to the client.
- **Client auth:** Use `getAuthClient()` (cookies) in server code; browser uses Supabase anon client for sign-in only.
- **Admin APIs:** All under `/api/admin/*`; all call `requireAdmin()` (or the appropriate role guard when scoped APIs are added).
- **Validation:** Zod schemas in `lib/validation/`; return 400 with `request_id` and flattened errors.

---

## Migrations and DB

- Migrations in `supabase/migrations/` (additive only; no destructive changes).
- Run: `npm run db:migrate` (uses Supabase link and `DATABASE_URL` from `.env.local` if needed).
- RLS: `is_admin()` and role helpers; application layer enforces provider/specialist scoping.

---

## Quality

- **Lint:** `npm run lint`
- **Tests:** `npm run test` (Vitest)
- **Build:** `npm run build`
- **Verify:** `npm run verify` (lint + test + build)

Existing flows (leads, Stripe, health, admin) must remain green.

---

## Docs

- [DATA_MODEL.md](DATA_MODEL.md) — Entities and curated network
- [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md) — Environment variables and Stripe
- [AUTH_AND_ROLES.md](AUTH_AND_ROLES.md) — Who can sign in, login flow, guards
- [DASHBOARD_ROLES.md](DASHBOARD_ROLES.md) — Dashboard responsibilities by role
