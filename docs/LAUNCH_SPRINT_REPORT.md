# Launch readiness sprint — implementation report

**Date:** March 2026  
**Objective:** Prepare the platform for launch and first real patients (medical tourism: Medellín → Manizales, Clínica San Martín).

---

## 1. Files modified

| File | Changes |
|------|--------|
| `supabase/migrations/0006_specialists_consultations_experiences.sql` | **New.** Tables: `specialists`, `experiences`, `consultations`. Columns on `packages`: `recovery_city`, `badge`. Columns on `leads`: `specialist_ids`, `experience_ids`. RLS policies. |
| `scripts/seed_medical_tourism.sql` | **New.** Seed for 3 two-city packages (Essential, Comfort, Premium), 6 specialists, 6 experiences. |
| `lib/packages.ts` | Added `recovery_city`, `badge` to type and selects. |
| `lib/specialists.ts` | **New.** `getPublishedSpecialists()`. |
| `lib/experiences.ts` | **New.** `getPublishedExperiences()`. |
| `lib/validation/lead.ts` | Added `specialist_ids`, `experience_ids` (arrays of UUIDs). |
| `app/api/leads/route.ts` | Insert now includes `specialist_ids`, `experience_ids`. |
| `app/assessment/page.tsx` | Fetches specialists + experiences; passes to form. Title "Free medical evaluation". |
| `app/assessment/AssessmentForm.tsx` | New props `specialists`, `experiences`. Checkbox groups for specialist and experience interests. Package select shows two-city label. |
| `app/page.tsx` | Hero copy "Your medical journey experience"; Free Medical Evaluation section; Why Medellín + Manizales; Travel packages intro; Meet Our Specialists section; Customize Your Recovery Experience section; package cards show badge and two-city; popularPackages by badge. |
| `app/admin/leads/[id]/page.tsx` | Displays "Specialist consultation requests" and "Experience interests" when present (resolved from IDs). |

---

## 2. New database migrations

- **`0006_specialists_consultations_experiences.sql`**
  - **packages:** `recovery_city text`, `badge text`.
  - **specialists:** `id`, `name`, `specialty`, `city`, `clinic`, `description`, `published`, `sort_order`.
  - **experiences:** `id`, `name`, `city`, `category`, `description`, `price_cents`, `duration_hours`, `published`, `sort_order`.
  - **consultations:** `id`, `lead_id`, `specialist_id`, `status`, `scheduled_date`, `scheduled_time`, `notes` (unique on lead_id, specialist_id).
  - **leads:** `specialist_ids uuid[]`, `experience_ids uuid[]`.
  - RLS: specialists and experiences public SELECT when published; consultations admin-only.

**Apply:** Run in Supabase SQL editor after `0005`. Then run `scripts/seed_medical_tourism.sql` for the 3 packages, specialists, and experiences.

---

## 3. UI changes

- **Landing**
  - Hero: "Your medical journey experience" + free evaluations, Medellín → Manizales.
  - New section: **Free medical evaluation** (short copy + CTA).
  - **Why Medellín + Manizales** (renamed from "Why choose us") with same trust cards.
  - **Travel packages:** intro line for two-city journey; package cards show **Medellín → Manizales** and **badge** (MOST POPULAR, ALL INCLUSIVE).
  - **Meet our specialists:** grid of specialist cards + "Request specialist consultations" CTA.
  - **Customize your recovery experience:** grid of experience cards (name, city, category, duration, price) + "Select experiences in your assessment" CTA.
- **Assessment**
  - "Free medical evaluation" heading.
  - **Travel package** select shows two-city label when `recovery_city` is set.
  - **Which specialists would you like to consult?** — checkboxes (optional).
  - **Recovery experiences you're interested in** — checkboxes (optional).
- **Admin lead detail**
  - **Specialist consultation requests** and **Experience interests** shown when the lead has any (names resolved from DB).

---

## 4. New components

- None. New sections use existing layout and `Link`; specialist and experience blocks are inline in `app/page.tsx`.

---

## 5. Production stability

- **Stripe webhook** (`app/api/stripe/webhook/route.ts`): unchanged; signature verification, idempotent update (status = pending → succeeded), lead status set to `deposit_paid`. No changes.
- **Lint:** `npm run lint` — pass.
- **Build:** `npm run build` — pass.

---

## 6. Next steps for go-live

1. **Supabase:** Run migration `0006_specialists_consultations_experiences.sql`, then `scripts/seed_medical_tourism.sql`.
2. **Optional:** Keep or replace existing `scripts/seed_packages.sql` (old slugs `smile-medellin`, `smile-manizales`). New seed adds `essential-care-journey`, `comfort-recovery-journey`, `premium-transformation-experience`.
3. **Admin:** Use lead detail to see specialist/experience interests; schedule consultations in `consultations` (UI for creating consultations can be a follow-up).
4. **First patient:** Follow [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md) and [PASOS_PARA_PROBAR.md](PASOS_PARA_PROBAR.md).

---

*Sprint: Launch readiness and first patient acquisition.*
