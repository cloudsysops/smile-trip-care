# Curated Medical Tourism Network — Enterprise Implementation Sprint Report

## 1. Files modified

- **Migration:** `supabase/migrations/0010_curated_network_enterprise.sql` (new)
- **Lib (domain):** `lib/providers.ts`, `lib/packages.ts`, `lib/specialists.ts`, `lib/experiences.ts` (extended); `lib/consultations.ts`, `lib/bookings.ts` (new)
- **Validation:** `lib/validation/lead.ts` (extended); `lib/validation/provider.ts`, `specialist.ts`, `experience.ts`, `package.ts`, `consultation.ts`, `booking.ts` (new)
- **API:** `app/api/leads/route.ts` (new lead fields persisted)
- **Admin APIs (new):** `app/api/admin/providers/route.ts`, `app/api/admin/providers/[id]/route.ts`, `app/api/admin/specialists/route.ts`, `app/api/admin/specialists/[id]/route.ts`, `app/api/admin/experiences/route.ts`, `app/api/admin/experiences/[id]/route.ts`, `app/api/admin/packages/[id]/route.ts`, `app/api/admin/consultations/route.ts`, `app/api/admin/consultations/[id]/route.ts`, `app/api/admin/bookings/route.ts`, `app/api/admin/bookings/[id]/route.ts`
- **Landing:** `app/page.tsx` (hero, trust, how-it-works, FAQ); `app/components/landing/package-card.tsx` (title/subtitle, cities, highlights)
- **Assessment:** `app/assessment/AssessmentForm.tsx` (travel_companions, budget_range, selected_experience_ids in body)
- **Admin UI:** `app/admin/overview/page.tsx` (nav links); `app/admin/providers/page.tsx`, `app/admin/specialists/page.tsx`, `app/admin/experiences/page.tsx`, `app/admin/bookings/page.tsx`, `app/admin/consultations/page.tsx` (new list pages)
- **Tests:** `tests/curated-network-validation.test.ts`, `tests/assessment-extended.test.ts`, `tests/providers-api.test.ts` (new)
- **Docs:** `docs/DATA_MODEL.md` (updated), `docs/CURATED_NETWORK_WORKFLOW.md` (new), `docs/MARKETPLACE_FOUNDATION.md` (new), `STATUS.md` (updated)

## 2. Migration(s) created

- **0010_curated_network_enterprise.sql** — Additive only:
  - **Providers:** slug, provider_type, country, contact_email, contact_phone, website, published; approval_status extended with `suspended`
  - **Packages:** package_type, title, subtitle, origin_city, destination_city, price_from_usd, highlights, includes, excludes (jsonb), updated_at
  - **Specialists:** slug, clinic_name, bio, photo_asset_id, free_evaluation; approval_status extended with `suspended`
  - **Experiences:** slug, price_usd, includes (jsonb); optional category constraint
  - **New tables:** package_experiences, package_specialists (with RLS)
  - **Leads:** selected_specialties, selected_experience_categories, selected_experience_ids, travel_companions, budget_range, utm_source, utm_medium, utm_campaign, updated_at
  - **Consultations:** scheduled_at
  - **Bookings:** total_price_usd, deposit_paid, start_date, end_date, notes; status check extended (draft, confirmed, in_progress, etc.)
  - **RLS:** providers/specialists public SELECT only when published + approved; packages RLS enabled with public_select (published) and admin_all

## 3. Admin APIs added

| Route | Methods | Purpose |
|-------|--------|--------|
| `/api/admin/providers` | GET, POST | List providers; create provider |
| `/api/admin/providers/[id]` | GET, PATCH | Get/update provider |
| `/api/admin/specialists` | GET, POST | List specialists; create specialist |
| `/api/admin/specialists/[id]` | GET, PATCH | Get/update specialist |
| `/api/admin/experiences` | GET, POST | List experiences; create experience |
| `/api/admin/experiences/[id]` | GET, PATCH | Get/update experience |
| `/api/admin/packages/[id]` | GET, PATCH | Get package with relations; update package |
| `/api/admin/consultations` | GET, POST | List/create consultations |
| `/api/admin/consultations/[id]` | GET, PATCH | Get/update consultation |
| `/api/admin/bookings` | GET, POST | List/create bookings |
| `/api/admin/bookings/[id]` | GET, PATCH | Get/update booking |

All use `requireAdmin()`, Zod validation, and structured JSON errors with `request_id`.

## 4. UI sections added/updated

- **Landing:** Hero copy (Free Medical Evaluation · Treatment in Medellín · Recovery in Manizales; trusted network); Trust section (curated private network, not open marketplace); How it works (6 steps including Choose package, Optional experiences); Packages (cards use title/subtitle, origin_city/destination_city, highlights when present); FAQ (free evaluation, package includes, flights, deposit, medical disclaimer)
- **Assessment:** Optional fields Travel companions and Budget range; payload includes selected_experience_ids
- **Admin:** New list pages for Providers, Specialists, Experiences, Bookings, Consultations; overview nav updated with links to all

## 5. Tests added

- **curated-network-validation.test.ts** — Provider, Specialist, Experience, Package, Consultation, Booking Zod schemas (create/update where applicable)
- **assessment-extended.test.ts** — LeadCreateSchema with new optional fields (selected_specialties, travel_companions, budget_range, utm_*, selected_experience_ids)
- **providers-api.test.ts** — Admin providers GET returns 403 when requireAdmin throws

Existing tests (leads-api, admin-api-validation, health, ai-schemas) remain green.

## 6. Docs updated

- **DATA_MODEL.md** — approval_status includes `suspended`; providers/specialists visibility (published + approved); packages/experiences enterprise fields; package_experiences, package_specialists; leads/bookings extended fields
- **CURATED_NETWORK_WORKFLOW.md** (new) — Entity lifecycle, admin-only APIs, public visibility summary
- **MARKETPLACE_FOUNDATION.md** (new) — Data foundation and key points for curated marketplace
- **STATUS.md** — New row for Curated network enterprise (0010); admin routes list updated; migration order note

## 7. Risks detected

- **Migration 0010:** Dropping and re-adding check constraints (providers/specialists approval_status, bookings status) is a one-time change; existing rows keep valid enum values. No data loss.
- **Packages RLS:** If packages had no RLS before, enabling it could block unauthenticated reads for unpublished packages; public catalog already uses server-side service role for published packages, so behavior is unchanged for public pages.
- **Admin UI:** List pages are read-only (no create/edit forms in UI); admins can use Supabase Dashboard or direct API calls until forms are added.

## 8. Rollback considerations

- **Code:** Revert PR; existing leads, Stripe, and health flows are unchanged.
- **DB:** Migration 0010 is additive. Rollback would require a new migration to drop added columns and tables (package_experiences, package_specialists) and to restore previous RLS policies if desired. Not recommended unless critical; prefer keeping 0010 and fixing forward.

## 9. Safe to merge?

**Yes**, with the following conditions:

- Run `0010_curated_network_enterprise.sql` on the target database (staging/production) in order after 0009.
- Ensure `is_admin()` exists and profiles.role is set for admins (already required for existing admin routes).
- Run `npm run lint`, `npm run test`, `npm run build` before merge (all passed in this sprint).

## 10. Recommended next sprint

- **Admin CRUD UI:** Forms (or modal flows) to create/edit providers, specialists, experiences; package relation editors for package_experiences and package_specialists.
- **Consultation/booking detail:** Admin pages for a single consultation or booking (e.g. `/admin/consultations/[id]`, `/admin/bookings/[id]`) with status update and scheduling.
- **Public package detail:** Use `getPackageWithRelations()` on `/packages/[slug]` to show linked specialists and experiences.
- **Seed/data:** Optional seed script for 0010 fields (e.g. backfill package_type from type, slug from name) for existing rows.
