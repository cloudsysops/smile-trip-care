# Data Model (MVP)

## Tables

| Table | Purpose | RLS |
|------|---------|-----|
| **profiles** | User profile + role (extends auth.users) | Own read/update; admin all |
| **packages** | Catalog of offerings (Medellín, Manizales) | Public SELECT if `published=true`; admin all |
| **leads** | Assessment form submissions | Admin only |
| **payments** | Stripe checkout/deposits linked to leads | Admin only |
| **assets** | Media (images, etc.) | Public SELECT if `approved=true` AND `published=true`; admin all |
| **itineraries** | Per-package or per-lead itinerary data (non-medical) | Admin only |
| **lead_ai** | Notes + AI outputs per lead | Admin only |

## Key fields

- **packages**: `slug`, `name`, `location`, `duration_days`, `deposit_cents`, `included` (array), `itinerary_outline`, `published`.
- **leads**: `first_name`, `last_name`, `email`, `phone`, `country`, `package_slug`, `message`, `status` (new → deposit_paid → …).
- **payments**: `lead_id`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `amount_cents`, `status`.
- **assets**: `storage_path`, `title`, `category` (clinic\|finca\|lodging\|tour\|team\|other), `location` (Medellín\|Manizales\|Other), `tags` (text[]), `alt_text`, `approved`, `published`, `deleted_at`.
- **lead_ai**: `lead_id`, `triage_json` (jsonb), `messages_json` (jsonb), `notes`.
- **itineraries**: optional `package_id`, optional `lead_id`, `city`, `content_json` (jsonb), legacy `day_index/title/description`.

## Admin helper

- `public.is_admin()`: returns true if current auth user has `profiles.role = 'admin'`. Used in RLS and server-side checks.

## Migrations

- `supabase/migrations/0001_init.sql`: creates all tables, indexes, RLS, policies, and `handle_new_user` trigger.
- `supabase/migrations/0003_m9_ai_admin_connected.sql`: extends `lead_ai` and `itineraries` for admin AI workflows.
- `scripts/seed_packages.sql`: inserts `smile-medellin` and `smile-manizales` as published packages.
