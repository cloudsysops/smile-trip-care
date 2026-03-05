# M8 — Health, Readiness & UX Completion

**Status:** Implemented  
**Based on:** CTO Full Verification Audit (Section 6–7)

This module delivers health/readiness APIs, thank-you redirect, migration consolidation, and audit fixes.

---

## 1. APIs

### GET /api/health (liveness)

- **Purpose:** Confirm the app process is running. Use for load balancers and orchestrators.
- **Auth:** None.
- **Response (200):**
  ```json
  {
    "status": "ok",
    "timestamp": "2025-03-04T12:00:00.000Z",
    "service": "smile-transformation-platform"
  }
  ```

**File:** `app/api/health/route.ts`

---

### GET /api/health/ready (readiness)

- **Purpose:** Confirm the app can serve traffic (Supabase config present and DB reachable).
- **Auth:** None.
- **Response (200 if ready):**
  ```json
  {
    "ready": true,
    "timestamp": "2025-03-04T12:00:00.000Z",
    "checks": {
      "supabase_config": "ok",
      "supabase_connect": "ok"
    }
  }
  ```
- **Response (503 if not ready):** Same shape with `ready: false` and one or more checks `"missing"` or `"error"`.

**File:** `app/api/health/ready/route.ts`

---

## 2. Database changes

- **Single migration:** `supabase/migrations/0002_assets_extended_unified.sql`
  - Replaces legacy `0002_assets_metadata.sql` and `0002_extend_assets.sql`.
  - Adds to `public.assets`: `storage_path`, `category`, `location`, `tags`, `alt_text`, `source_url`, `deleted_at`.
  - Adds constraints: `assets_category_check`, `assets_location_check`.
  - Backfills `storage_path` from `slug` where null; sets `storage_path` NOT NULL.
  - Creates indexes: `idx_assets_category`, `idx_assets_location`, `idx_assets_category_location`, `idx_assets_created_at`.
  - No new tables.
- **Apply order:** Run `0001_init.sql` then `0002_assets_extended_unified.sql`. If you already applied the old 0002 files, this migration is idempotent (`if not exists` / `do $$`).

---

## 3. UI

### Assessment → Thank-you redirect

- **Behavior:** On successful `POST /api/leads`, if the response includes `lead_id`, the client redirects to `/thank-you?lead_id=<uuid>` instead of showing success in-place.
- **File:** `app/assessment/AssessmentForm.tsx`
  - Uses `useRouter()` and `router.push(\`/thank-you?lead_id=${encodeURIComponent(leadId)}\`)` when `res.ok` and `data.lead_id` is present.

### Admin — System status

- **Route:** `/admin/status`
- **Auth:** Admin only (`requireAdmin()`); redirects to `/admin/login?next=/admin/status` if not authenticated or not admin.
- **Content:** Fetches `GET /api/health` and `GET /api/health/ready` from the client and displays JSON (liveness + readiness and checks).
- **Files:**
  - `app/admin/status/page.tsx` — Server component, requires admin, layout with links to Leads, Assets, Sign out.
  - `app/admin/status/StatusDashboard.tsx` — Client component, fetches both health endpoints and shows results.

---

## 4. Code fixes (from audit)

### Admin assets [id] route (Next 15+ params)

- **File:** `app/api/admin/assets/[id]/route.ts`
- **Change:** `params` typed as `Promise<{ id: string }>` and accessed via `const { id } = await params` in both PATCH and DELETE.

### Asset validation cleanup

- **File:** `lib/validation/asset.ts`
- **Change:** Single `import { z } from "zod"`; one set of schemas: `ASSET_CATEGORIES`, `ASSET_LOCATIONS`, `AssetCategorySchema`, `AssetLocationSchema`, `AssetMetadataSchema`, `AssetUpdateSchema` (from `AssetMetadataSchema.partial().extend(...)`), `AssetFilterSchema`, `AssetUploadSchema`, `validateAssetFile`, types. Removed duplicate `AssetUpdateSchema` and duplicate import.

---

## 5. File list

| Action | Path |
|--------|------|
| **New** | `app/api/health/route.ts` |
| **New** | `app/api/health/ready/route.ts` |
| **New** | `app/admin/status/page.tsx` |
| **New** | `app/admin/status/StatusDashboard.tsx` |
| **New** | `supabase/migrations/0002_assets_extended_unified.sql` |
| **New** | `docs/MODULE_M8_SPEC.md` (this file) |
| **Modified** | `app/assessment/AssessmentForm.tsx` (redirect on success) |
| **Modified** | `app/api/admin/assets/[id]/route.ts` (async params) |
| **Modified** | `lib/validation/asset.ts` (dedupe schemas) |
| **Removed** | `supabase/migrations/0002_assets_metadata.sql` |
| **Removed** | `supabase/migrations/0002_extend_assets.sql` |

---

## 6. How to test

1. **Liveness:** `curl -s http://localhost:3000/api/health` → 200, `"status":"ok"`.
2. **Readiness:** `curl -s http://localhost:3000/api/health/ready` → 200 with `ready: true` when Supabase is configured and reachable; 503 otherwise.
3. **Thank-you:** Submit assessment form with valid data → redirect to `/thank-you?lead_id=<uuid>`.
4. **Admin status:** Log in as admin, open `/admin/status` → see liveness and readiness JSON.
5. **Admin assets PATCH/DELETE:** Ensure editing/deleting an asset still works (params fix).
6. **Build:** `npm run build` and `npm run lint` pass.
