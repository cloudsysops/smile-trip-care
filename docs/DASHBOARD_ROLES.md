# Dashboard responsibilities by role

Role-based dashboards give each user type a single place to work. All dashboards are protected server-side with the corresponding role guard.

---

## Admin dashboard — `/admin`

**Who:** `role = 'admin'`  
**Guard:** `requireAdmin()`

**Responsibilities:**

- Leads (list, detail, status, AI tools)
- Providers (create, approve, edit)
- Specialists (create, approve, edit)
- Experiences and packages
- Consultations and bookings
- Assets and automation/status
- Overview KPIs (leads today/week, pending approvals, income)

Existing admin pages and APIs remain unchanged; they already use `requireAdmin()`.

---

## Provider dashboard — `/provider`

**Who:** `role = 'provider_manager'` with `profiles.provider_id` set  
**Guard:** `requireProviderManager()`

**Shows only the provider’s own data:**

- Provider profile (name, city, approval status)
- Packages for this provider
- Specialists for this provider
- Experiences for this provider
- Recent bookings for this provider

If `provider_id` is null, the page shows a message asking the user to contact an admin.

---

## Specialist dashboard — `/specialist`

**Who:** `role = 'specialist'` with `profiles.specialist_id` set  
**Guard:** `requireSpecialist()`

**Shows:**

- Specialist profile (name, specialty, city, approval status)
- Consultation requests for this specialist
- Requested/scheduled/completed dates
- Simple action/status view

If `specialist_id` is null, the page asks the user to contact an admin.

---

## Coordinator dashboard — `/coordinator`

**Who:** `role = 'coordinator'` (or admin)  
**Guard:** `requireCoordinator()`

**Shows:**

- Active leads (new, contacted, qualified)
- Bookings in progress
- Consultations needing follow-up (requested, scheduled)
- Operations/travel coordination context

Data is not scoped to a single provider; coordinators see operational breadth.

---

## Patient dashboard — `/patient`

**Who:** `role = 'patient'` or `user` (or admin)  
**Guard:** `requirePatient()`

**Shows (matched by profile email):**
- Profile summary (name, email)
- Submitted assessments (leads with same email)
- Recommended package per lead (orientation only; admin can override)
- Booking status (deposit, dates)
- Payment status
- **Next actions:** “Pay deposit” for leads that have not yet paid (Stripe checkout; patient can only pay for their own lead)

Patient data is matched by `lead.email = profile.email`. Patients can sign up at `/signup`; other roles are admin-created.

---

## Data access layer

- **lib/dashboard-data.ts** provides role-scoped helpers:
  - `getProviderDashboardData(providerId)` — provider’s packages, specialists, experiences, bookings
  - `getSpecialistDashboardData(specialistId)` — specialist’s consultations
  - `getCoordinatorDashboardData()` — active leads, bookings, consultations
  - `getPatientDashboardData(email)` — leads, bookings, consultations, payments for that email

All use the server Supabase client (service role). RLS remains in place; application code restricts by `provider_id` / `specialist_id` / email as appropriate.

---

## Navigation and UX

- Each dashboard has a simple header with role-specific title and links.
- Reuses the existing design system (zinc palette, cards, tables).
- Loading and empty states: “No bookings yet”, “Your account is not linked to a provider”, etc.
- No over-design; focus on correctness and launch readiness.

See [AUTH_AND_ROLES.md](AUTH_AND_ROLES.md) for login flow and who can sign in.
