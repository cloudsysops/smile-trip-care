# Reuse and improvement backlog — MedVoyage Smile

Prioritized list derived from the platform acceleration audit. Use this to pick the next sprint or to avoid re-auditing the same areas.

---

## A. Immediate low-risk wins (done or trivial)

| Item | Status | Notes |
|------|--------|--------|
| Sign out on all role dashboards | ✅ Done | Patient, specialist, coordinator, provider + RoleDashboardHeader. |
| StatCard in coordinator and provider | ✅ Done | Replaces ad-hoc metric divs. |
| Reusable role dashboard header | ✅ Done | RoleDashboardHeader used by specialist, coordinator, provider. |
| Specialist nav: Progress link | ✅ Done | Link to /specialist/progress in header. |
| Auth entry points (Sign in / Sign up) on home + mobile | ✅ Done (prior sprint) | QA_VISIBLE_ROUTE_AUDIT + mobile nav fix. |

---

## B. Medium reusable system improvements (recommended next)

| Item | Risk | Effort | Description |
|------|------|--------|-------------|
| DashboardLayout in role pages | Low | Small | Wrap main content of /patient, /specialist, /coordinator, /provider in DashboardLayout (title, description, actions) so framing matches admin. |
| EmptyState component | Low | Small | Reusable empty state (icon/title/description/CTA) for empty tables and sections; use in coordinator, provider, specialist. |
| DataTable in coordinator tables | Low | Small | Replace raw `<table>` in coordinator (Recent leads, Consultations) with DataTable + column config for consistency with admin/leads. |
| Link to admin/leads from coordinator | Low | Trivial | Add “View in admin” or “Leads” link to coordinator that goes to /admin/leads (for users who have both roles). |
| Patient dashboard: optional DashboardLayout | Low | Small | Use DashboardLayout for “Overview” and “Clinical progress” sections only; keep journey portal as-is. |

---

## C. Future enhancements to defer

| Item | Reason to defer |
|------|-----------------|
| Sidebar navigation for roles | Current top nav is sufficient; sidebar adds complexity and design decisions. |
| Full dashboard unification (one shell for all roles) | Different roles need different nav and content; unification is a large refactor. |
| Copying more from nuevo-repo (sidebar, cards, tables) | DASHBOARD_REUSE_PLAN already adapted the main patterns; more copy risks style drift. |
| Notifications / in-app alerts | Out of scope for this backlog; treat as product feature later. |
| Settings pages per role | No pressing need; add when a role has real settings. |

---

## D. Explicitly rejected for now

| Item | Reason |
|------|--------|
| Replace Supabase Auth | High risk; current auth works. |
| Broad Stripe or webhook refactor | Not needed for platform acceleration. |
| New schema or migrations | Backlog is UI and reuse only. |
| Kubernetes, Jenkins, microservices | Out of scope. |
| Copy whole repos or large subsystems | Reuse patterns only; Smile remains canonical. |

---

## Reusable assets (current)

- **Layout/chrome:** AdminShell (admin), RoleDashboardHeader (specialist, coordinator, provider), DashboardLayout + DashboardHeader + DashboardSection (admin content).
- **Data display:** StatCard, DataTable (typed columns, optional getRowHref).
- **Clinical progress:** TreatmentProgressTimeline, TreatmentStageBadge, SpecialistProgressUpdateForm, PatientNextStepCard.
- **Landing:** Package cards, specialist cards, AuthorityBar, WhatsAppButton.

Use these first when adding or changing dashboards and role pages.
