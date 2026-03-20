# Marketplace Foundation (Curated)

Nebula Smile's “marketplace” is a **curated private network**, not an open directory. This doc summarizes the data and API foundation that supports it.

---

## Data foundation

- **providers** — Clinics, tour operators, hotels, transport, wellness. Admin-only create; public sees only approved + published.
- **packages** — Health / tour / combo offers linked to a provider. Fields include `title`, `subtitle`, `origin_city`, `destination_city`, `price_from_usd`, `highlights`, `includes`, `excludes`. Public sees only published.
- **specialists** — Linked to providers; approval + publish gating. Public sees only approved + published.
- **experiences** — Recovery/tourism activities linked to providers. Public sees only published.
- **package_experiences** — Which experiences are linked to a package (with `is_included`, `sort_order`).
- **package_specialists** — Which specialists are linked to a package (with `is_primary`).
- **leads** — From assessment form; can store `package_id`, specialist/experience interests, `travel_companions`, `budget_range`, UTM.
- **consultations** — Lead–specialist scheduling; admin-only.
- **bookings** — One per lead when they choose a package; status and deposit tracking.

---

## Key points

1. **No public provider/specialist onboarding.** All creation and approval is admin-only.
2. **RLS** enforces public read only for published (and approved where applicable) rows; admin has full access via service role in server-side code.
3. **Landing** presents the network as “curated,” “invitation-only,” with clear messaging (hero, trust section, FAQ).
4. **Assessment form** captures package interest, specialist/experience interests, budget range, and travel companions; all mapped to lead fields.

---

## Sample seeded entities (Marketplace Foundation seed)

The seed file **`scripts/seed_marketplace_foundation.sql`** (run after migration 0010) creates the following sample data. All entities are **approved** and **published** so they appear in the public catalog.

| Entity | Slug(s) | Description |
|--------|--------|-------------|
| **Provider** | `clinica-san-martin` | Clínica San Martín — Medellín, clinic, family network, contact info and website. |
| **Specialists** | `dra-maria-sierra`, `dr-carlos-ramirez` | Dr. María Sierra (Dental Aesthetics, primary on packages), Dr. Carlos Ramírez (Oral Rehabilitation). Both linked to Clínica San Martín, free evaluation. |
| **Experiences** | `coffee-farm-experience`, `hot-springs-recovery`, `medellin-city-discovery` | Coffee farm (Manizales, culture, 4h, $80), Hot Springs Recovery (Manizales, recovery, 3h, $95), Medellín City Discovery (Medellín, culture, 4h, $70). |
| **Packages** | `essential-care-journey`, `comfort-recovery-journey`, `premium-transformation-experience` | Three combo packages: Essential (8 days, from $2,500, deposit $500), Comfort (10 days, from $3,800, deposit $1,000, badge MOST POPULAR), Premium (12 days, from $5,500, deposit $1,500, badge ALL INCLUSIVE). All Medellín → Manizales. |
| **package_specialists** | — | All three packages linked to both specialists; Dra. María Sierra marked `is_primary` per package. |
| **package_experiences** | — | All three packages linked to all three experiences; `is_included = true` only for Premium; sort_order: Medellín City 1, Coffee 2, Hot Springs 3. |

The seed is **idempotent**: it uses `ON CONFLICT` on `providers(slug)`, `specialists(slug)`, `experiences(slug)`, `packages(slug)`, and the primary keys of `package_specialists` and `package_experiences`, so it can be re-run to refresh data without duplicating rows.

---

## Seed execution order

1. **Migrations** — Run all migrations in order (0001 through **0010_curated_network_enterprise.sql**). Example: `npm run db:migrate` or apply each migration in the Supabase SQL Editor.
2. **Existing package seed (optional)** — If you use `scripts/seed_medical_tourism.sql`, run it **after** 0006 (it inserts packages with slug/name/location/duration_days/deposit_cents etc.). If you use **only** the marketplace foundation seed, you can skip this; `seed_marketplace_foundation.sql` creates its own packages and expects the 0010 schema. If both seeds are used, run `seed_medical_tourism.sql` first so that base packages exist; then run `seed_marketplace_foundation.sql` to upsert the same slugs with provider_id and enterprise fields (and to add provider, specialists, experiences, and junctions).
3. **Marketplace foundation seed** — Run `scripts/seed_marketplace_foundation.sql` after 0010. Example: `psql "$DATABASE_URL" -f scripts/seed_marketplace_foundation.sql` or paste the script into the Supabase SQL Editor.

**Recommended for a clean dev DB:** Run migrations 0001 → 0010, then run **only** `seed_marketplace_foundation.sql` to get one provider, two specialists, three experiences, three combo packages, and their relations.

---

See [DATA_MODEL.md](DATA_MODEL.md), [CURATED_NETWORK_WORKFLOW.md](CURATED_NETWORK_WORKFLOW.md), [CURATED_NETWORK_FOUNDATION.md](CURATED_NETWORK_FOUNDATION.md).
