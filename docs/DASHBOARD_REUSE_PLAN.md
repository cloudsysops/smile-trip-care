# Dashboard reuse plan — MedVoyage Smile

**Purpose:** Reuse proven dashboard patterns from `nuevo-repo` (EMPRESAS Platform) to speed up work on Smile dashboards (admin, patient, and other roles) **without** copying full products or refactoring the MVP. This is an audit + plan only; no code changes were made.

**Risk:** **SAFE** (docs only, no schema/Stripe/auth/API changes).

---

## 1. Source dashboards audited

Reference repo: `/Users/dragon/cboteros/proyectos/nuevo-repo`

### 1.1 Empresas Platform — web dashboards

Key files reviewed:

- `apps/empresas-platform-unified/src/pages/dashboard.tsx`
  - Unified dashboard MVP with tabs (`overview` / `wellness` / `peskids` / `ai`), metric cards, and grids.
- `apps/empresas-platform-unified/src/pages/unified-dashboard.tsx`
  - "Hacker" unified dashboard with header, tabbed views (`overview` / executive / operational / technical / financial), system stats, alerts, and auto-refresh.
- `apps/empresas-platform-unified/src/pages/unified-enterprise-dashboard.tsx`
  - Enterprise monitoring dashboard; multi-tab (overview, projects, security, wallets, agents, gaming, cards), alerts bar, auto-refresh, and metric sections.
- `apps/empresas-platform-unified/src/pages/notion-admin.tsx`
  - Admin-like panel for Notion: tabs, stat cards, search + filters, table view for entities.
- `apps/empresas-platform-unified/src/pages/users.tsx`
  - Users admin list with search box, filter button, and generic `DataTable` for sortable/paginated data.
- `apps/empresas-platform-unified/src/components/analytics/Analytics.tsx`
  - Analytics view with metric cards, charts, top pages/sources — good reference for `/admin/analytics` and future BI.
- `apps/empresas-platform-unified/services/dashboard/app/page.tsx`
  - App Router dashboard shell (tabs + content areas: Chat, Tools, Pipelines, Status); header + footer, max-width layout.

Shared layout / UI components:

- `apps/empresas-platform-unified/src/components/layout/Navigation.tsx` — top nav for marketing + dashboard links (includes `/dashboard`, analytics, etc.).
- `apps/empresas-platform-unified/src/components/layout/Sidebar.tsx` — sidebar nav with icon + label + badges; good pattern for role-based sidebars.
- `apps/empresas-platform-unified/src/components/ui/Card.tsx` — generic card wrapper (padding variants, hover, motion).
- `apps/empresas-platform-unified/src/components/ui/Button.tsx` — button variants and sizes used across dashboards.
- `apps/empresas-platform-unified/src/components/ui/DataTable.tsx` — generic table: columns config, sorting, pagination, optional search and row actions.
- `apps/empresas-platform-unified/services/dashboard/components/SystemStatus.tsx` + `services/dashboard/app/globals.css` — status badges, buttons, and card styles (`.status-badge`, `.card`, `.btn-primary`, etc.).
- `apps/empresas-platform-unified/src/styles/hacker-theme.css` — table and badge styles (`.table-hacker`, `.badge-hacker`, etc.).

### 1.2 Wellness Tourism (web)

- `apps/wellness-tourism/web/app/wellness/page.tsx`
  - Landing-like wellness page (hero, features, services, testimonials). Not a dashboard, but useful as a reference for **journey storytelling**.

### 1.3 Mobile

- `apps/mobile/src/features/dashboard/HomeScreen.tsx`
  - Minimal mobile dashboard (React Native) with a simple welcome card; little to reuse directly, but reinforces the card-first pattern.

---

## 2. Current Smile dashboards (for comparison)

Target repo: `/Users/dragon/cboteros/proyectos/smile-transformation-platform`

- `app/admin/_components/AdminShell.tsx` — Header with nav items (`Leads`, `Outbound`, `Analytics`, `Assets`, `Status`) and sign-out; acts as a lightweight layout shell for admin.
- `app/admin/overview/page.tsx` — Admin Overview: top KPIs (leads today/week, pending approvals, bookings with deposit, monthly income); grid of simple cards.
- `app/admin/leads/page.tsx` + `app/admin/leads/AdminLeadsList.tsx` + `app/admin/leads/[id]/page.tsx`
  - Lead list with priority badges and “Next action”; lead detail with status, recommendation, deposit, follow-up, AI actions, outbound queue.
- `app/admin/analytics/*` — Conversion analytics dashboard (`ANALYTICS_DASHBOARD.md` describes metrics + `/admin/analytics`).
- `app/patient/page.tsx` + `app/components/dashboard/*Section.tsx`
  - Patient journey dashboard: profile card, journey portal, treatment plan, travel plan, timeline, care coordinator, aftercare.
- `app/coordinator/page.tsx` — Coordinator overview: KPIs (active leads, bookings, consultations) + tables of leads/bookings/consultations.
- `app/provider/page.tsx` — Provider dashboard: provider summary + KPIs (packages, specialists, experiences, bookings) + table of bookings.
- `app/specialist/page.tsx` — Specialist dashboard: specialist profile + consultations table.
- Docs: `docs/DASHBOARD_ROLES.md`, `docs/DASHBOARDS_POR_ROL.md`, `docs/ANALYTICS_DASHBOARD.md` — conceptual design and partial implementation status by role.

Conclusion: Smile already has **solid role dashboards and admin shell**, but lacks a unified **Dashboard System** (shared layout + sidebar + cards + tables) used across roles.

---

## 3. Reusable patterns from nuevo-repo

### 3.1 Layout and navigation patterns

**A — Reuse concept as-is (adapted to Smile context)**

1. **Dashboard layout shell**  
   - **Source:** `services/dashboard/app/page.tsx`, `src/pages/dashboard.tsx`, `unified-dashboard.tsx`, `unified-enterprise-dashboard.tsx` (Empresas).  
   - **Pattern:** `min-h-screen` background, header with title + controls, nav tabs, `max-w-7xl` main content, footer.  
   - **Smile target:** `DashboardLayout` wrapper for admin and potential future unified dashboards (e.g. `/admin/overview`, `/admin/analytics`), reusing Smile’s existing subdued visual style.

2. **Sidebar navigation**  
   - **Source:** `src/components/layout/Sidebar.tsx` + `Navigation.tsx`.  
   - **Pattern:** vertical nav with icons, labels, optional badges (counts), active state styling.  
   - **Smile target:** `DashboardSidebar` for multi-section roles (future: if admin grows beyond the current top-nav shell); for now, concept is useful but Smile’s current admin nav is already simple and sufficient.

**B — Clone and adapt into Smile**

3. **Top-level nav with sections**  
   - **Source:** `Navigation.tsx` in empresas-platform-unified.  
   - **Pattern:** top nav with links to major sections and highlighted “Demo/Dashboard”.  
   - **Smile target:** Extend `AdminShell` and (if ever needed) a unified `/dashboard` by reusing the “highlight key CTAs in nav” idea — but not the visual hacker/marketing styles.

### 3.2 Cards and stats

**A — Reuse concept as-is**

4. **Metric/stat cards grid**  
   - **Source:** `src/pages/dashboard.tsx` (users/revenue/wellness/ai), `enterprise/Dashboard.tsx`, `Analytics.tsx`.  
   - **Pattern:** small cards with title, main number, change %, and optional icon; grouped in responsive grids.  
   - **Smile target:** Admin Overview (`/admin/overview`) already uses similar cards. The pattern can be formalized as `StatCard` in Smile for reuse in admin, provider, coordinator, specialist dashboards.

**B — Clone and adapt**

5. **System status cards / alerts bar**  
   - **Source:** `unified-enterprise-dashboard.tsx` (alerts bar + status), `SystemStatus.tsx`.  
   - **Pattern:** alert chips (error/warning/success/info), with dismiss buttons; system status cards.  
   - **Smile target:** Later use on `/admin/status` (already exists) or operational panels; not needed immediately for admin/patient core dashboards.

### 3.3 Tables, filters, and search

**B — Clone and adapt**

6. **Generic data table with sorting/pagination/actions**  
   - **Source:** `src/components/ui/DataTable.tsx` + usage in `users.tsx`.  
   - **Pattern:** typed `DataTable<T>` with columns config, optional search, sortable headers, pagination, and actions column.  
   - **Smile target:** A simplified `DataTable` pattern **inspired** by this, but built directly in Smile (or incremental refactors in existing tables like admin leads), **without** importing the original code.

7. **Search + filter bar above tables**  
   - **Source:** `users.tsx` (search input + filter button).  
   - **Pattern:** search box (with icon) and filter button above the table.  
   - **Smile target:** For future leads/analytics filters in Smile dashboards when there is real volume; not required for MVP, but good reference.

### 3.4 Status badges and visual language

**A/B — Reuse concept; clone styles as needed**

8. **Status badge classes**  
   - **Source:** `services/dashboard/app/globals.css` (`.status-badge`, `.status-success`, `.status-warning`, `.status-error`) and hacker theme (`.badge-hacker`, `.badge-success`, etc.).  
   - **Pattern:** pill badges with consistent colors and semantics per status.  
   - **Smile target:** We already use badges (e.g. priority/next action in admin leads); we can **document** a status/priority palette and, over time, unify their Tailwind classes.

### 3.5 Analytics widgets

**C — Reference only**

9. **Advanced analytics panels**  
   - **Source:** `Analytics.tsx`, `business-intelligence.tsx`, metrics dashboards.  
   - **Pattern:** multi-metric dashboards, charts, and top-lists.  
   - **Smile target:** Our `ANALYTICS_DASHBOARD.md` already defines a lean conversion dashboard; these empresas panels are useful as **inspiration** for future advanced analytics, but we should not clone them 1:1.

---

## 4. Reuse classification (summary)

- **A — Reuse concept as-is:**
  - Dashboard layout shell (header + max-width main + footer).
  - Metric/stat cards in responsive grids.
  - Status/alert bar concept (for later on `/admin/status`).
- **B — Clone and adapt into Smile:**
  - DataTable pattern (columns, sortable, paginated, actions).
  - Search + filter bar for admin data tables.
  - Sidebar nav concept (if we later move admin to a sidebar layout).
- **C — Reference only:**
  - High-complexity enterprise dashboards (unified-dashboard, unified-enterprise-dashboard) → inspiration, not direct reuse.
  - BI-specific pages (business-intelligence, metrics, etc.).
- **D — Archive / ignore for Smile:**
  - Hacker theme skins, mobile card demos, and domain-specific dashboards that don’t match MedVoyage’s UX.

---

## 5. Mapping to Smile dashboards

### 5.1 Admin dashboard (`/admin` + `/admin/overview`)

- **Existing:** AdminShell + Overview page with KPIs; leads, providers, specialists, experiences, bookings, consultations, assets, analytics, status pages.
- **Reuse from nuevo-repo:**
  - Stat card grid pattern (A).
  - System status and alerts bar concept for `/admin/status` (A/B, later).
  - DataTable patterns (B) for future richer tables (filters, sorting) if needed.

### 5.2 Patient dashboard (`/patient`)

- **Existing:** Full journey dashboard with profile, journey portal, timeline, treatment/travel/aftercare sections and deposit CTA.
- **Reuse from nuevo-repo:**
  - Layout idea (header + secondary nav + main grid) but Smile already has a good structure.  
  - Card grid patterns for journey steps and treatment/package summary (A).

### 5.3 Coordinator, provider, specialist (`/coordinator`, `/provider`, `/specialist`)

- **Existing:** Basic dashboards with KPIs and tables, each scoped to its role.
- **Reuse from nuevo-repo:**
  - Stat cards for key counts (A).
  - DataTable pattern (B) for more advanced interaction when needed (filters/search/actions).

---

## 6. Suggested Dashboard System for Smile

**Components (future, not yet implemented):**

- `components/dashboard/DashboardLayout`  
  Wrapper for role dashboards using Smile’s existing look: header, optional role label, max-width content.

- `components/dashboard/Sidebar` (optional, later)  
  Only if/when admin grows into many sections; conceptually similar to empresas `Sidebar.tsx`.

- `components/dashboard/StatCard`  
  Small metric card with title, value, optional label and icon. Can back `AdminOverview`, provider/coordinator/specialist KPIs.

- `components/dashboard/DataTable`  
  Simple abstraction around `<table>` with typed columns, optional sort and pagination — **inspired** by `DataTable.tsx` in empresas, but built with Smile’s minimal needs in mind.

- `components/dashboard/StatusBadge`  
  Reusable pill for statuses and priorities, using Tailwind utility classes instead of empresas’ CSS.

- `components/dashboard/ActivityFeed` (optional)  
  Later: small feed of recent lead or booking activity for admin/coordinator.

This system would be shared across:

- Admin
- Patient
- Coordinator
- Provider
- Specialist

without forcing a single monolithic dashboard; each role keeps its own page and data.

---

## 7. Biggest risks if we rebuild from scratch

1. **Inconsistent UX across roles** — Different card/table styles for each dashboard; operators get confused.
2. **Rework on tables** — Re-implementing search/sort/pagination patterns multiple times instead of having a small reusable `DataTable`.
3. **Over-designed analytics** — Copying full enterprise dashboards from empresas risks misalignment with MedVoyage’s simpler funnel-focused needs.
4. **Time to value** — Rebuilding basic patterns (cards, tables, nav) would consume sprints that could go to conversion, operations, or sales improvements.

---

## 8. Recommended implementation order (for future sprints)

1. **Standardize admin overview (SAFE/MODERATE):**  
   - Introduce `StatCard` in Smile and refactor `/admin/overview` to use it (no behavior change).

2. **Introduce a light `DataTable` pattern (MODERATE):**  
   - Start with one table (e.g. admin leads list or coordinator leads); keep API and data types unchanged.

3. **Unify status badges (SAFE):**  
   - Document a status/priority color palette; gradually apply to leads priority, booking statuses, etc.

4. **Optional:** evolve `/admin/status` using the status/alerts ideas from empresas (`SystemStatus`, alerts bar) **if** you need deeper operational views.

> This plan is intentionally conservative: reuse ideas and patterns, but keep Smile’s MVP stable and avoid pulling in heavy enterprise complexity from nuevo-repo.
