# Phased implementation — Production readiness

Controlled phases; no redesign of unrelated parts. MVP kept stable.

---

## Phase 1 — Auth and role guards ✅

**Status:** In place.

- **lib/auth.ts:** `getCurrentUser`, `getCurrentProfile`, `getRedirectPathForRole`, `requireAdmin`, `requireCoordinator`, `requireProviderManager`, `requireSpecialist`, `requirePatient`.
- **Login:** `/login` uses `GET /api/auth/me` for role-based redirect (admin → /admin, patient → /patient, etc.).
- **Signup (patient only):** `/signup` + `POST /api/signup` create profile with `role = 'patient'`.
- **Guards:** All admin routes and role dashboards use the corresponding `require*`; unauthenticated or wrong role → redirect or 403.

**No code changes in this phase.**

---

## Phase 2 — Patient dashboard ✅

**Status:** In place.

- **Route:** `/patient` protected by `requirePatient()`; redirect to `/login?next=/patient` if not authenticated.
- **Data:** `getPatientDashboardData(email)` — leads, bookings, consultations, payments by email.
- **UI:** Profile summary; KPIs (assessments, bookings, consultations, payments); table with recommended package and "Pay deposit" / "Deposit paid".
- **PatientDepositButton:** Calls `POST /api/stripe/checkout` (patient success/cancel default to /patient).

**No code changes in this phase.**

---

## Phase 3 — Package clarity ✅

**Status:** Package detail page shows name, location, description, duration, deposit, included, itinerary outline. Optional: show journey/recovery cities when present (additive only).

- **app/packages/[slug]/page.tsx:** Add a single line or small block for recovery_city / origin_city / destination_city when available (no layout change).

---

## Phase 4 — Assessment recommendation ✅

**Status:** In place.

- **POST /api/leads:** Sets `recommended_package_slug` and `recommended_package_id` from form selection; returns `recommended_package_slug` in 201.
- **AssessmentForm:** Redirects to thank-you with `lead_id` and `recommended_package_slug`.
- **Thank-you page:** Shows recommended package block and disclaimer ("orientation only; final treatment planning belongs to the specialist").
- **Admin lead detail:** Shows recommended package; LeadRecommendationForm to override.
- **Migration:** 0020 adds `leads.recommended_package_slug` and `recommended_package_id`.

**No code changes in this phase.**

---

## Phase 5 — Payment testing flow ✅

**Status:** In place.

- **Admin:** DepositButton on lead detail → POST /api/stripe/checkout → Stripe Checkout → webhook updates payments + leads + bookings.
- **Patient:** PatientDepositButton on /patient for own leads (email match) → same checkout API; success/cancel to /patient.
- **Checkout API:** Uses `recommended_package_slug ?? package_slug` for amount and product name.

**No code changes in this phase.**

---

## Phase 6 — Other dashboards ✅

**Status:** In place.

- **/provider:** `requireProviderManager()`, `getProviderDashboardData(provider_id)` — provider, packages, specialists, experiences, bookings.
- **/specialist:** `requireSpecialist()`, `getSpecialistDashboardData(specialist_id)` — specialist, consultations.
- **/coordinator:** `requireCoordinator()`, `getCoordinatorDashboardData()` — leads, bookings, consultations.
- **/admin:** `requireAdmin()`, overview, leads, outbound, assets, status, etc.

**No code changes in this phase.**

---

## Phase 7 — Docs and tests ✅

**Status:** In place.

- **Docs:** AUTH_AND_ROLES, DASHBOARD_ROLES, DATA_MODEL, TEST_FIRST_SALE, STATUS, PRODUCTION_READINESS_SPRINT_OUTPUT.
- **Tests:** 69 tests; stripe-checkout mocks getCurrentProfile; lint and build pass.

**No code changes in this phase.**

---

## Summary

| Phase | Focus              | Status   | Action        |
|-------|--------------------|----------|---------------|
| 1     | Auth and role guards | Done     | Verify only   |
| 2     | Patient dashboard  | Done     | Verify only   |
| 3     | Package clarity    | Done     | Optional label for journey cities |
| 4     | Assessment recommendation | Done | Verify only   |
| 5     | Payment testing flow | Done   | Verify only   |
| 6     | Other dashboards   | Done     | Verify only   |
| 7     | Docs and tests     | Done     | Verify only   |

Only Phase 3 may receive one additive change (package detail: show recovery/origin/destination when present). All other phases are verification-only; MVP unchanged.
