# AI Agents Runtime Overview

## Active agents

- `lead-triage`
- `sales-responder`
- `itinerary-generator`
- `ops-coordinator`

> `marketing-content` is planned and not yet implemented.

## Safety and output rules

- All prompts include global safety instructions:
  - strict JSON only
  - no medical advice / diagnosis / treatment instructions / guarantees
- All outputs are validated with Zod before persistence.
- Failed validation is treated as execution failure and does not expose stack traces to clients.

## Trigger-driven automation (M14)

AI execution is queued via `ai_automation_jobs` and executed by `/api/automation/worker`.

### Trigger: lead created

- Source: `POST /api/leads`
- Enqueued jobs:
  - `lead-triage`
  - `sales-responder`

### Trigger: lead marked `deposit_paid`

- Source: `POST /api/stripe/webhook` (`checkout.session.completed`)
- Enqueued jobs:
  - `itinerary-generator`
  - `ops-coordinator`

### Trigger: inactive lead 24h/48h

- Source: `POST /api/automation/followups` (secret-protected cron endpoint)
- Enqueued jobs:
  - `sales-responder` for `lead_inactive_24h`
  - `sales-responder` for `lead_inactive_48h`

## Queue lifecycle

Statuses in `ai_automation_jobs`:

- `pending`
- `processing`
- `completed`
- `retry_scheduled`
- `dead_letter`

Worker behavior:

1. Claim due jobs (`pending` / `retry_scheduled` with `run_after <= now`)
2. Lock and execute
3. On success → `completed`
4. On failure:
   - retry with backoff if attempts remain
   - `dead_letter` when attempts exhausted

## Idempotency

- Unique key on `(lead_id, trigger_type, job_type)` prevents duplicate jobs for the same trigger scope.
- Enqueue uses upsert with `ignoreDuplicates`.

## Operational endpoints

- `POST /api/automation/followups`
- `POST /api/automation/worker`

Both require `AUTOMATION_CRON_SECRET` via `x-automation-secret` or Bearer token.

## Assisted outbound conversion (M16)

AI responders still generate drafts into `lead_ai.messages_json`, and admin now has an outbound lifecycle queue:

- Data model: `outbound_messages`
- Channels: `whatsapp`, `email`
- Source: `ai_draft` or `manual`
- Lifecycle statuses:
  - `draft`
  - `approved`
  - `queued`
  - `sent`
  - `delivered`
  - `failed`
  - `replied`
  - `cancelled`

This keeps execution human-supervised while enabling measurable conversion tracking per lead.

M17 adds an admin outbound command center (`/admin/outbound`) and API metrics endpoints so sales operators can prioritize queue actions and SLA-risk leads from AI-generated drafts.

M18 adds `POST /api/automation/outbound-worker`:

- Claims due outbound messages (`approved`, `queued`, `failed` with due schedule)
- Dispatches through configured providers (`resend` for email, HTTP provider for WhatsApp)
- Marks `sent` on success
- On failure:
  - schedules retry with backoff while attempts remain
  - keeps failed-permanent state once max attempts is reached
