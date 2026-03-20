# Analytics Dashboard

This document describes the **Conversion Intelligence** dashboard for admins: a lightweight analytics page to see what’s working in the funnel.

## Location

- **URL:** `/admin/analytics`
- **Access:** Admin only (same auth as other admin pages).
- **Nav:** Linked from the admin shell as **Analytics**.

## Metrics

| Metric | Description |
|--------|-------------|
| **Total leads** | Count of all leads in the system. |
| **Leads today** | Leads created since start of today (UTC). |
| **Leads this week** | Leads created since start of current week (Monday UTC). |
| **High priority leads** | Leads that have either `package_slug` or `budget_range` set (proxy for qualified interest). |
| **Packages requested** | Count of leads with a `package_slug` (selected a package in assessment). |
| **Assessment → package interest** | Percentage of leads that have a package selected (with package / total). |
| **Leads by country** | Bar chart of lead count per country (top 15). |

## Tech

- **Data:** Supabase `leads` table; counts and aggregates only (no schema changes).
- **Charts:** `recharts` (e.g. `BarChart` for leads by country).
- **Page:** Server component fetches metrics; client component renders the chart.

## Files

- `app/admin/analytics/page.tsx` — Server page; fetches metrics and passes to charts.
- `app/admin/analytics/AnalyticsCharts.tsx` — Client component; recharts bar chart.
- `app/admin/_components/AdminShell.tsx` — Nav updated with Analytics link.

## Safety

- Read-only Supabase queries.
- No new tables or migrations; uses existing `leads` columns.
