# Production Readiness + Role Dashboards + Sales Flow — Sprint Output

**Sprint scope:** Prepare the platform for production: auth, role dashboards, package recommendation, patient signup, and full deposit flow (admin + patient). Additive changes only; MVP flows preserved.

---

## 1. Files modified

| File | Change |
|------|--------|
| `app/api/leads/route.ts` | Set `recommended_package_slug` / `recommended_package_id` on lead insert; return `recommended_package_slug` in 201 response |
| `app/assessment/AssessmentForm.tsx` | Redirect to thank-you with `recommended_package_slug` query param |
| `app/thank-you/page.tsx` | Show recommended package block (name, deposit, disclaimer), link to package detail, “Log in to your dashboard” |
| `app/login/page.tsx` | Copy: “Create patient account” link; clarify who is admin-created |
| `app/api/auth/me/route.ts` | No change (already returns role + redirectPath) |
| `app/api/stripe/checkout/route.ts` | Allow admin or patient; patient only for own lead (email match); use `recommended_package_slug ?? package_slug` for amount/name; default success/cancel URLs by role |
| `app/api/admin/leads/[id]/route.ts` | PATCH accepts `recommended_package_slug`; resolve and set `recommended_package_id` |
| `app/admin/leads/[id]/page.tsx` | Deposit amount from recommended_package_slug ?? package_slug; show recommended package in dl; add LeadRecommendationForm |
| `app/patient/page.tsx` | Profile summary; recommended package column; next action “Pay deposit” (PatientDepositButton) |
| `lib/dashboard-data.ts` | Patient leads select includes `recommended_package_slug`; bookings select includes `deposit_cents` |
| `supabase/migrations/MIGRATION_ORDER.md` | Add 0020 |
| `docs/AUTH_AND_ROLES.md` | Patient signup at /signup + POST /api/signup |
| `docs/DASHBOARD_ROLES.md` | Patient: profile summary, recommended package, next actions (Pay deposit) |
| `docs/DATA_MODEL.md` | leads: recommended_package_slug, recommended_package_id |
| `docs/TEST_FIRST_SALE.md` | Thank-you recommendation; patient Pay deposit option; admin vs patient collect deposit |
| `STATUS.md` | New row: Production readiness + role dashboards + sales flow |
| `tests/stripe-checkout-api.test.ts` | Mock getCurrentProfile (admin context) instead of requireAdmin |

---

## 2. Migrations created

| Migration | Purpose |
|-----------|---------|
| **0020_leads_recommended_package.sql** | Add `leads.recommended_package_slug` (text), `leads.recommended_package_id` (uuid FK to packages); index on recommended_package_id |

---

## 3. Auth changes

- **Login:** Unchanged; already uses GET /api/auth/me and role-based redirectPath (admin → /admin, patient → /patient, etc.).
- **Optional patient signup:** New **`/signup`** page (full name, email, password). On submit: Supabase Auth `signUp` then **POST /api/signup** to create profile with `role = 'patient'`. Link from login “Create patient account”.
- **Profiles:** No new columns; 0018 already has id, email, full_name, role, provider_id, specialist_id, is_active, created_at, updated_at. Signup API inserts profile for new user with role patient only.

---

## 4. Dashboards created / updated

- **/patient:** Profile summary (name, email); assessments table with **Recommended package** column and **Next action** “Pay deposit” (or “Deposit paid”); booking and payment tables unchanged. **PatientDepositButton** calls POST /api/stripe/checkout (no URLs; API uses default /patient success/cancel).
- **/provider, /specialist, /coordinator, /admin:** No structural changes. Admin lead detail gains recommended package display and **LeadRecommendationForm** (override dropdown).

---

## 5. Package changes

- **Package model:** No new package types or seed in this sprint. Package detail page and list unchanged. Deposit in checkout and admin is resolved from **recommended_package_slug ?? package_slug** (admin can override recommendation in lead detail).
- **Package patterns (Oral Health Medellín, Manizales, Recovery Journey, Premium):** Not added in this sprint; can be done via seed or content. Existing packages and detail page remain sales-ready as-is.

---

## 6. Recommendation flow changes

- **On assessment submit:** Lead is created with `recommended_package_slug` and `recommended_package_id` set to the package selected in the form (if any). API returns `recommended_package_slug` in 201 body.
- **Thank-you page:** Reads `lead_id` and `recommended_package_slug` from query; fetches package by slug; shows “Recommended package (orientation)” with name, deposit, **disclaimer**: “This recommendation is based on the information provided and serves as an orientation only. Final treatment planning belongs to the specialist.” Link to package detail.
- **Admin:** Lead detail shows “Recommended package”; **LeadRecommendationForm** lets admin select another package and PATCH. Deposit section uses recommended (or form) package for amount.
- **Patient dashboard:** Shows recommended_package_slug per lead; “Pay deposit” uses checkout that resolves amount from recommended/package slug.

---

## 7. Tests added / updated

- **stripe-checkout-api.test.ts:** Mock **getCurrentProfile** (returns admin context) instead of requireAdmin; lead row includes `recommended_package_slug`, `email` for patient check path. All three tests pass.
- **Existing:** leads-api, assessment-extended, auth-role, health, smoke, etc. unchanged; **69 tests pass**, lint and build pass.

---

## 8. Docs updated

- **AUTH_AND_ROLES.md:** Patient signup at /signup, POST /api/signup.
- **DASHBOARD_ROLES.md:** Patient dashboard: profile summary, recommended package, next actions (Pay deposit).
- **DATA_MODEL.md:** leads: recommended_package_slug, recommended_package_id.
- **TEST_FIRST_SALE.md:** Thank-you recommendation; patient Pay deposit; admin vs patient collect deposit.
- **STATUS.md:** New module row for Production readiness + role dashboards + sales flow.

---

## 9. Risks detected

- **Signup API:** If Supabase is configured to require email confirmation, the user may not have a session immediately after signUp; then POST /api/signup might run before the session exists. Consider redirecting to login with a “Confirm your email” message, or disable email confirmation in Supabase for dev.
- **Profile insert:** Requires that the `profiles` table accepts insert from the server (service role). If RLS blocks insert, signup will fail; ensure RLS allows service role or has a policy for insert where id = auth.uid() after signup.
- **Patient checkout:** Patient can only start checkout for leads where lead.email matches profile.email (case-insensitive). No change to webhook or payment flow; existing Stripe integration unchanged.

---

## 10. Safe to merge

**Yes.** All changes are additive:

- New migration 0020; no destructive schema changes.
- New routes: /signup, POST /api/signup.
- Checkout extended to allow patient (with email check); admin flow unchanged.
- Lead recommendation stored and displayed; existing lead/booking/payment flows intact.
- MVP (leads, admin, Stripe, webhook) unchanged; tests green.

**Before deploy:** Run migration 0020 on the target database (`npm run db:migrate` or apply `0020_leads_recommended_package.sql`). Ensure profiles table exists and accepts insert (e.g. from 0018 or base init).
