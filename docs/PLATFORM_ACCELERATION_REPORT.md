# Platform acceleration report — MedVoyage Smile

**Sprint goal:** Improve the platform by reusing the best patterns and strengthening dashboards, auth UX, and operational clarity — without destabilizing the MVP.

**Date:** 2026-03-12  
**Risk level:** MODERATE (UI + reusable components only; no Stripe, auth core, or schema changes).

---

## 1. Audit summary (Phase 1)

### 1.1 Current Smile architecture (reviewed)

| Area | State |
|------|--------|
| **App routes** | 36 page routes: home, assessment, login, signup, thank-you, patient, specialist, coordinator, provider, admin (overview, leads, leads/[id], analytics, assets, outbound, status, etc.), packages, legal, landing variants. |
| **Auth** | Supabase Auth; `getCurrentProfile()`, `requireAdmin()`, `requireSpecialist()`, `requirePatient()`, etc. Login/signup at `/login`, `/signup`; entry points in home nav (Sign in, Sign up). Sign out existed only in AdminShell. |
| **Dashboards** | **Admin:** AdminShell + DashboardLayout + StatCard + DataTable (overview, leads, analytics). **Patient:** Custom header + sections (TreatmentPlan, Travel, Timeline, Clinical progress). **Specialist:** Custom header + consultations table + Progress link. **Coordinator / Provider:** Custom header + raw metric divs + tables. No shared “role” chrome; no Sign out on patient/coordinator/provider/specialist. |
| **Reusable components** | DashboardLayout, DashboardHeader, DashboardSection, StatCard, DataTable (admin). TreatmentProgressTimeline, TreatmentStageBadge, SpecialistProgressUpdateForm, PatientNextStepCard (clinical). No shared role-dashboard header. |
| **Lead funnel** | Assessment → lead → admin/leads; specialist progress; patient timeline. Documented in CLINICAL_PROGRESS_SYSTEM.md, QA_VISIBLE_ROUTE_AUDIT.md. |
| **QA / scripts** | `npm run verify` (lint, test, build). Docs: DEPLOY_CHECKLIST, TEST_FIRST_SALE, QA_VISIBLE_ROUTE_AUDIT. |

### 1.2 Reusable sources (audited)

- **Smile repo:** DashboardLayout, StatCard, DataTable, AdminShell; DASHBOARD_REUSE_PLAN.md, DASHBOARD_SYSTEM_STEP2/3/4 reports.
- **Reference workspace:** `/Users/dragon/cboteros/proyectos` — nuevo-repo (empresas-platform-unified), empresas. DASHBOARD_REUSE_PLAN already maps StatCard/DataTable/shell patterns from there into Smile; no direct copy, “clone and adapt” only.

### 1.3 Gaps identified

- **Auth discoverability:** Sign out was only in admin; patient, specialist, coordinator, provider had no way to sign out from the UI.
- **Dashboard consistency:** Coordinator and provider used ad-hoc metric divs instead of StatCard; role pages used custom headers with duplicated structure.
- **Navigation:** Specialist had no nav link to “Progress”; role headers were not reusable.
- **Operational clarity:** Same layout/chrome pattern repeated across four role dashboards without a shared component.

---

## 2. Files reviewed (exact)

- `app/page.tsx` — home, nav (Sign in, Sign up already exposed; mobile fix in prior sprint).
- `app/patient/page.tsx` — patient dashboard header and sections.
- `app/specialist/page.tsx` — specialist dashboard header and consultations.
- `app/coordinator/page.tsx` — coordinator dashboard and metric cards.
- `app/provider/page.tsx` — provider dashboard and metric cards.
- `app/admin/_components/AdminShell.tsx` — admin chrome and Sign out.
- `app/components/dashboard/DashboardLayout.tsx`, `StatCard.tsx`, `DataTable.tsx` — existing reusable pieces.
- `lib/auth.ts` — profile and role helpers (unchanged).
- `docs/DASHBOARD_REUSE_PLAN.md`, `docs/CLINICAL_PROGRESS_SYSTEM.md` — context.

---

## 3. Files changed (exact)

| File | Change |
|------|--------|
| `app/components/dashboard/RoleDashboardHeader.tsx` | **New.** Reusable header for role dashboards: title, nav items, Home link, Sign out form. Used by specialist, coordinator, provider. |
| `app/specialist/page.tsx` | Replaced custom header with `RoleDashboardHeader`; added nav item “Progress” → `/specialist/progress`; added Sign out. Empty state (no specialist_id) also uses RoleDashboardHeader. |
| `app/coordinator/page.tsx` | Replaced custom header with `RoleDashboardHeader`; replaced three metric divs with `StatCard`; added Sign out. |
| `app/provider/page.tsx` | Replaced custom header with `RoleDashboardHeader`; replaced four metric divs with `StatCard`; added Sign out. Empty state (no provider_id) also uses RoleDashboardHeader. |
| `app/patient/page.tsx` | Added Sign out form to existing header (no structural change; patient keeps its own nav and branding). |

---

## 4. Reusable patterns adopted or strengthened

- **RoleDashboardHeader:** New shared component for role dashboards. Props: `title`, `navItems` (href, label, active), optional `homeHref`/`homeLabel`, `maxWidth`. Renders: Home link, nav links, title, Sign out (POST to `/api/auth/signout`). Aligns specialist, coordinator, provider with a single pattern; patient keeps custom header but gains Sign out.
- **StatCard:** Already present; now used in coordinator (3 cards) and provider (4 cards) so metric blocks match admin/overview style and reduce duplicate markup.
- **Auth discoverability:** Sign out is now visible and consistent on all role dashboards (patient, specialist, coordinator, provider) and admin (unchanged).

---

## 5. Improvements shipped

1. **Sign out on all role dashboards** — Patient, specialist, coordinator, and provider can sign out from the header without going to admin.
2. **Reusable RoleDashboardHeader** — One component for specialist, coordinator, and provider; same chrome and behavior; easier to extend (e.g. more nav items).
3. **Specialist nav: “Progress”** — Specialist dashboard has an explicit “Progress” link to `/specialist/progress` for updating treatment progress.
4. **Coordinator metrics with StatCard** — Active leads, Bookings in progress, Consultations use StatCard with optional helper text.
5. **Provider metrics with StatCard** — Packages, Specialists, Experiences, Recent bookings use StatCard; “Recent bookings” has helper “last 20”.
6. **Consistent main padding** — Role pages use `px-4 py-8 sm:px-6` for main content where the new header is used.

---

## 6. Verification result

- **Lint:** Passed.
- **Tests:** 23 test files, 69 tests passed.
- **Build:** Next.js build succeeded.
- **Scope:** No Stripe, webhook, auth core, or schema changes. No API contract changes.

---

## 7. Next best sprint (prioritized)

**Recommended next:** Continue “QA full usable” and small hardening.

1. **Optional:** Use `DashboardLayout` (title/description/actions) inside role dashboards for the main content area, so page framing matches admin overview/leads (low risk, high consistency).
2. **Optional:** Add a reusable `EmptyState` component (illustration or icon + title + description + optional CTA) and use it where tables/sections are empty (coordinator, provider, specialist).
3. **Defer:** Broad sidebar navigation, full dashboard unification, or copying more from reference repos until product stabilizes further.
4. **Reject for now:** Replacing Supabase Auth, changing Stripe/webhook logic, adding new schema, or introducing heavy new infra.

---

## 8. How the app got better

- **Operational usability:** Coordinators and providers see metrics in the same card style as admin; specialists have a clear path to Progress; everyone can sign out from their dashboard.
- **Consistency:** Role dashboards (specialist, coordinator, provider) share one header component and StatCard for metrics.
- **Reuse:** One new component (RoleDashboardHeader) and one existing one (StatCard) used in more places reduce duplication and make future changes easier.
- **QA readiness:** Sign out and navigation are clearer for manual testing and founder use.
