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
| **ai_automation_jobs** | Durable queue for trigger-driven AI execution | Admin only |
| **outbound_messages** | Assisted outbound queue and delivery tracking per lead | Admin only |

## Key fields

- **packages**: `slug`, `name`, `location`, `duration_days`, `deposit_cents`, `included` (array), `itinerary_outline`, `published`.
- **leads**: `first_name`, `last_name`, `email`, `phone`, `country`, `package_slug`, `message`, `status` (new → deposit_paid → …), attribution fields `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `landing_path`, `referrer_url`, and sales-ops follow-up fields `last_contacted_at`, `next_follow_up_at`, `follow_up_notes`.
- **payments**: `lead_id`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `amount_cents`, `status`.
- **assets**: `storage_path`, `title`, `category` (clinic\|finca\|lodging\|tour\|team\|other), `location` (Medellín\|Manizales\|Other), `tags` (text[]), `alt_text`, `approved`, `published`, `deleted_at`.
- **lead_ai**: `lead_id`, `triage_json` (jsonb), `messages_json` (jsonb), `ops_json` (jsonb), `followup_24h_json` (jsonb), `followup_48h_json` (jsonb), `triage_completed`, `response_generated`, `itinerary_generated`, `ops_generated`, `notes`.
- **ai_automation_jobs**: `lead_id`, `trigger_type`, `job_type`, `status`, `attempts`, `max_attempts`, `run_after`, `locked_at`, `locked_by`, `payload_json`, `error_message`.
- **outbound_messages**: `lead_id`, `source`, `channel`, `status`, `subject`, `body_text`, `attempts`, `scheduled_for`, `sent_at`, `delivered_at`, `replied_at`, `failure_reason`, `created_by`, `approved_by`.
- **itineraries**: optional `package_id`, optional `lead_id`, `city`, `content_json` (jsonb), legacy `day_index/title/description`.

## Admin helper

- `public.is_admin()`: returns true if current auth user has `profiles.role = 'admin'`. Used in RLS and server-side checks.

## Migrations

- `supabase/migrations/0001_init.sql`: creates all tables, indexes, RLS, policies, and `handle_new_user` trigger.
- `supabase/migrations/0002_assets_extended_unified.sql`: extends `assets` metadata fields and indexes for moderation/public rendering.
- `supabase/migrations/0003_m9_ai_admin_connected.sql`: extends `lead_ai` and `itineraries` for admin AI workflows.
- `supabase/migrations/0004_leads_attribution.sql`: adds lead attribution fields (UTM, landing path, referrer) for conversion analytics.
- `supabase/migrations/0005_leads_follow_up_queue.sql`: adds sales follow-up queue fields and index (`next_follow_up_at`) on leads.
- `supabase/migrations/0006_ai_automation_foundation.sql`: extends `lead_ai` with automation outputs and status flags for trigger-based AI execution.
- `supabase/migrations/0007_ai_automation_jobs.sql`: creates durable trigger queue table with idempotency and retry/dead-letter lifecycle fields.
- `supabase/migrations/0008_outbound_messages.sql`: creates assisted outbound queue table for draft/approval/send/reply lifecycle tracking.
- `supabase/migrations/0009_payments_idempotency.sql`: enforces unique Stripe checkout session/payment intent IDs for payment idempotency.
- `scripts/seed_packages.sql`: inserts `smile-medellin` and `smile-manizales` as published packages.
