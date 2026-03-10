# Production data fix: landing package slugs (404)

**Problem:** The three package URLs linked from the landing page 404 in production because the corresponding package rows are missing or unpublished in the deployed Supabase environment.

**Slugs:** `essential-care-journey`, `comfort-recovery-journey`, `premium-transformation-experience`

**Scope:** Analysis and recommended steps only. No implementation in this doc.

---

## 1. Source of truth seed file

The **source of truth** for these three package slugs is:

- **`scripts/seed_marketplace_foundation.sql`**

It defines all three packages with full schema (provider_id, type, price_cents, title, subtitle, origin_city, destination_city, price_from_usd, highlights, includes, excludes, badge), links them to provider `clinica-san-martin`, and to specialists/experiences via `package_specialists` and `package_experiences`. It is **idempotent** (ON CONFLICT on slug for packages).

A secondary reference is **`scripts/seed_medical_tourism.sql`**, which inserts the same three slugs with a simpler column set (no provider_id, no jsonb highlights/includes/excludes). It was written for an older migration set and is referenced by `scripts/run_migrations.sh` as the follow-up seed. The marketplace foundation seed is the one that matches the current app and docs (MARKETPLACE_FOUNDATION.md).

**`scripts/seed_curated_network.sql`** contains the same three slugs and is a duplicate of the marketplace foundation content (same structure).

---

## 2. Missing package rows

In production, the following rows are missing (or exist with `published = false`):

| slug | name (from seed) |
|------|------------------|
| `essential-care-journey` | Essential Care Journey |
| `comfort-recovery-journey` | Comfort Recovery Journey |
| `premium-transformation-experience` | Premium Transformation Experience |

The app uses `getPublishedPackageBySlug(slug)`, which filters `published = true`. So either:

- The rows do not exist, or  
- The rows exist but `published` is false.

Fixing means ensuring these three rows exist and have **`published = true`**.

---

## 3. Safest fix (recommended)

**Recommended: run the existing marketplace foundation seed in production.**

- **Why:** One script, idempotent, matches docs and app. It creates/updates provider (Clínica San Martín), specialists, experiences, the three packages, and their junctions. No new scripts, no manual row editing.
- **Caveat:** The seed expects the **migrations** to be already applied (including 0014 provider_id/type/price_cents on packages, 0016 providers/specialists, 0017 package_type/title/subtitle/etc.). If production is up to date with migrations, running the seed is safe.

**Alternative (smallest fix):** If you want to **only** add the three package rows and not touch providers/specialists/experiences (e.g. production already has other providers and you want to avoid any chance of overwriting), use a **focused SQL** that only inserts/updates the three rows in `public.packages` with minimal columns (`slug`, `name`, `location`, `recovery_city`, `description`, `duration_days`, `deposit_cents`, `included`, `itinerary_outline`, `published = true`, `badge`). Leave `provider_id` null; the package page still works.

**Not recommended for production data fix:** Creating the three packages manually through the admin UI only if the app has a full “create package” form; otherwise manual creation is error‑prone and schema‑heavy.

---

## 4. Exact execution steps

### Option A — Run existing seed (recommended)

1. **Confirm migrations are applied** in the production Supabase project (Dashboard → SQL Editor or DB history). All of 0001 through 0020 (see `supabase/migrations/MIGRATION_ORDER.md`) should be applied.

2. **Get a Postgres connection string** for production:  
   Supabase Dashboard → Project Settings → Database → Connection string (URI). Use the **transaction** pooler if available (e.g. port 6543). Copy it; you will use it as `DATABASE_URL`.

3. **Run the seed from the repo (from your machine):**
   ```bash
   cd /path/to/smile-transformation-platform
   export DATABASE_URL="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/seed_marketplace_foundation.sql
   ```
   Or from Supabase Dashboard:
   - Open **SQL Editor**.
   - Paste the **entire** contents of `scripts/seed_marketplace_foundation.sql`.
   - Run the script.

4. **Verify:** In SQL Editor run:
   ```sql
   select slug, name, published from public.packages
   where slug in ('essential-care-journey', 'comfort-recovery-journey', 'premium-transformation-experience');
   ```
   You should see three rows, all with `published = true`.

5. **Smoke test:** Open in the browser:
   - `https://<your-production-domain>/packages/essential-care-journey`
   - `https://<your-production-domain>/packages/comfort-recovery-journey`
   - `https://<your-production-domain>/packages/premium-transformation-experience`  
   Each should return 200 and show the package page.

### Option B — Focused “packages only” fix (minimal change)

Use this only if you must avoid touching providers/specialists/experiences (e.g. production already has different provider data).

1. In Supabase Dashboard → **SQL Editor**, run the following (idempotent: inserts or updates only these three rows):

```sql
insert into public.packages (
  slug, name, location, recovery_city, description, duration_days,
  deposit_cents, included, itinerary_outline, published, badge
)
values
  (
    'essential-care-journey',
    'Essential Care Journey',
    'Medellín',
    'Manizales',
    'Treatment in Medellín with Clínica San Martín, then recovery in Manizales. Ideal for focused care and value.',
    8,
    50000,
    array['medical coordination','airport pickup','transport Medellín to Manizales','recovery guidance'],
    'Day 1-2: Medellín arrival, consultation. Day 3-4: Treatment. Day 5: Transfer to Manizales. Day 6-8: Recovery & departure.',
    true,
    null
  ),
  (
    'comfort-recovery-journey',
    'Comfort Recovery Journey',
    'Medellín',
    'Manizales',
    'Our most popular journey with accommodation, transport, and curated recovery support.',
    10,
    100000,
    array['medical coordination','lodging','airport pickup','transport Medellín to Manizales','support during recovery'],
    'Day 1-3: Medellín consultation & treatment. Day 4: Transfer. Day 5-9: Manizales recovery + experience. Day 10: Departure.',
    true,
    'MOST POPULAR'
  ),
  (
    'premium-transformation-experience',
    'Premium Transformation Experience',
    'Medellín',
    'Manizales',
    'All-inclusive transformation journey with premium accommodation, private transport, and curated recovery experiences.',
    12,
    150000,
    array['medical coordination','premium lodging','private transport','recovery support','selected experiences'],
    'Day 1-4: Medellín. Day 5: Transfer. Day 6-12: Manizales recovery + experiences. Day 13-14: Departure.',
    true,
    'ALL INCLUSIVE'
  )
on conflict (slug) do update set
  name = excluded.name,
  location = excluded.location,
  recovery_city = excluded.recovery_city,
  description = excluded.description,
  duration_days = excluded.duration_days,
  deposit_cents = excluded.deposit_cents,
  included = excluded.included,
  itinerary_outline = excluded.itinerary_outline,
  published = true,
  badge = excluded.badge,
  updated_at = now();
```

2. Verify and smoke test as in Option A (steps 4 and 5).

---

## 5. Risk classification

| Approach | Risk | Notes |
|----------|------|--------|
| **Option A — Run seed_marketplace_foundation.sql** | **LOW** | Idempotent; uses ON CONFLICT. May add/update one provider, two specialists, three experiences, three packages, and their links. If production already has different provider/specialist data, review seed content first. |
| **Option B — Focused packages-only SQL** | **LOW** | Only touches `public.packages` for the three slugs. No provider/specialist/experience changes. `provider_id` stays null; package pages still work. |

---

## 6. Summary

- **Source of truth:** `scripts/seed_marketplace_foundation.sql`
- **Missing rows:** The three package rows (or they exist with `published = false`).
- **Safest fix:** Run `scripts/seed_marketplace_foundation.sql` in production after confirming migrations (Option A). If you need minimal impact, use the focused packages-only SQL (Option B).
- **Exact steps:** See Section 4 (Option A or B, then verify + smoke test).
- **Risk:** LOW for both options.
