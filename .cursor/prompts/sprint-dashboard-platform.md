Use .cursor/prompts/sprint-template.md

Goal:
Unify all dashboards into a coherent SaaS dashboard system.

Existing primitives:
- AdminShell
- DashboardLayout
- DashboardSection
- RoleDashboardHeader
- StatCard
- DataTable
- EmptyState

Tasks:

1. Audit all dashboards

- /admin/overview
- /admin/leads
- /admin/analytics
- /patient
- /specialist
- /coordinator
- /provider

Identify:
- layout inconsistencies
- spacing issues
- repeated UI patterns
- ad-hoc tables or cards.

2. Apply DashboardLayout consistently

Ensure all role pages use:

- DashboardLayout
- DashboardSection

3. Standardize metrics

Use StatCard for:

- coordinator metrics
- provider metrics
- admin metrics

4. Standardize tables

Use DataTable for:

- admin leads
- coordinator leads
- consultations

5. Standardize empty states

Replace ad-hoc text with EmptyState component.

6. Create documentation

Create:

- docs/DASHBOARD_SYSTEM.md

Explain:

- AdminShell
- RoleDashboardHeader
- DashboardLayout
- StatCard
- DataTable
- EmptyState

Provide example page structure.

7. Run verification

- npm run verify

