# Dashboard system — Step 3 report (DashboardLayout + admin pages)

**Goal:** Introduce a lightweight reusable layout structure for dashboards and apply it to key admin pages, keeping all business logic and queries unchanged.

**Risk:** **MODERATE (bajo)** — UI/container-only refactor; lint + tests + build siguen pasando.

---

## 1. Components added

### 1.1 `DashboardLayout`

- **File:** `app/components/dashboard/DashboardLayout.tsx`
- **Exports:**
  - `export default function DashboardLayout(props: { title, description?, actions?, children, className? })`
  - `export function DashboardHeader({ title, description, actions })`
  - `export function DashboardSection({ title?, description?, children, className? })`
- **Purpose:**
  - Provide a consistent page frame for dashboards:
    - Title.
    - Optional description.
    - Optional actions area (e.g. filters/toggles/buttons).
    - Sections with consistent spacing.
- **Structure:**
  - `DashboardLayout`:
    - Wraps content in `div.space-y-6`.
    - Renders a `DashboardHeader` at the top.
    - Renders `children` underneath (usually `DashboardSection` blocks).
  - `DashboardHeader`:
    - Left: `h2` with main title; optional description under it.
    - Right: optional `actions` slot (for buttons/toggles).
  - `DashboardSection`:
    - Optional `title` and `description`.
    - Content block for cards, tables, etc.
- **Styling:**
  - Uses existing Tailwind patterns: `border-b border-zinc-200`, `text-zinc-900`, `text-zinc-600`, simple responsive adjustments.

This keeps the layout lightweight and reusable across admin, patient, and other role dashboards later.

---

## 2. Pages updated

### 2.1 Admin overview (`/admin/overview`)

- **File:** `app/admin/overview/page.tsx`
- **Before:**
  - Custom header with nav (Overview, Leads, Providers, Specialists, Experiences, Bookings, Consultations, Assets).
  - `<main>` with `h2 "Overview"` and a grid of cards (now `StatCard`).
- **After:**
  - Header (nav) **unchanged** — still shows the same links.
  - `<main>` content now uses `DashboardLayout`:
    - `title="Overview"`.
    - `description="High-level funnel and network metrics for the admin."`.
    - A single `DashboardSection` containing the stat card grid:
      - `StatCard` for:
        - Leads today.
        - Leads this week.
        - Pending approvals (with providers + specialists breakdown).
        - Bookings with deposit.
        - Income this month.
- **Important:** All Supabase queries, metrics, and links remain identical. Only the layout container changed.

### 2.2 Admin leads (`/admin/leads`)

- **Files:**
  - `app/admin/leads/page.tsx` — unchanged: still uses `AdminShell` and pulls the same `leads` data.
  - `app/admin/leads/AdminLeadsList.tsx` — now wraps the list in `DashboardLayout`.
- **Before:**
  - `AdminLeadsList` rendered:
    - Top bar with count and “Show action queue / Show all” toggle.
    - Raw `<table>` with all lead columns.
- **After:**
  - `AdminLeadsList` now returns:

    ```tsx
    <DashboardLayout
      title="Leads"
      description="Actionable view of assessment leads with priority and next steps."
      actions={/* Show action queue toggle */}
    >
      <DashboardSection>
        <p className="mb-3 text-sm text-zinc-600">
          {visibleLeads.length} leads...
        </p>
        <DataTable
          columns={columns}
          rows={visibleLeads}
          emptyMessage="No leads yet. New assessments will appear here."
        />
      </DashboardSection>
    </DashboardLayout>
    ```

  - The **logic and semantics** remain:
    - Same `visibleLeads` computation (priority and sorting).
    - Same score badges (`leadScore`).
    - Same priority badges.
    - Same “Next action” and date columns.
    - Same “Open” button linking to `/admin/leads/[id]`.
    - Same “Show action queue / Show all” toggle moved into the `actions` slot of `DashboardLayout`.

Admin pages now share a common dashboard framing while preserving their original behavior.

---

## 3. Files created/changed

- **Created**
  - `app/components/dashboard/DashboardLayout.tsx`
  - `docs/DASHBOARD_SYSTEM_STEP3_REPORT.md` (este archivo)
- **Changed**
  - `app/admin/overview/page.tsx` — main content wrapped in `DashboardLayout` + `DashboardSection`; stat cards unchanged.
  - `app/admin/leads/AdminLeadsList.tsx` — wrapped in `DashboardLayout` + `DashboardSection`; table rendering still driven by `DataTable` and existing column definitions.

---

## 4. Why the layout is reusable

- Abstracts only **page framing**:
  - Title / description / actions.
  - Vertical spacing and section separation.
- Independent of:
  - Role (admin, patient, coordinator, provider, specialist).
  - Data shape.
  - Data sources or queries.
- Combines well with:
  - `StatCard` (for metrics at the top).
  - `DataTable` (for tabular sections).
- Future use cases:
  - `/patient` — “My journey” dashboard shell.
  - `/coordinator`, `/provider`, `/specialist` — role dashboards with consistent headers and sections.
  - `/admin/analytics` — analytics dashboard framed with the same layout.

---

## 5. Verification

- Command: `npm run verify`
- Result (after changes):
  - **Lint:** Passes (apart from pre-existing Sonar warnings about inline cell components, which are informational).
  - **Tests:** 69 tests passing (23 files).
  - **Build:** Next.js build compiles (no schema/Stripe/auth changes introduced).

---

## 6. Recommended next step

Following the evolving dashboard system:

1. **Optional small step:** Use `DashboardLayout` on one more admin page (e.g., `/admin/analytics` or `/admin/status`) to confirm the pattern holds in a variety of content.
2. **Sidebar (when needed):** Once a couple more pages share the same layout, introduce a role-aware `DashboardSidebar` for admin (inspired by `nuevo-repo`’s Sidebar) and decide whether to:
   - keep the current top nav, or
   - move admin to a left-sidebar layout for larger screens.
3. **Role dashboards:** Gradually align `/patient`, `/coordinator`, `/provider`, `/specialist` to use `DashboardLayout` as the outer frame, while keeping their data and behavior unchanged.

All of this can remain SAFE/MODERATE as long as:
- queries and contracts stay the same,
- schema/Stripe/auth/webhooks remain untouched,
- and each sprint focuses on a small, contained UI refactor.

