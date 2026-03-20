# Follow-up Engine

This document describes the **Follow-up Engine** for leads: AI-generated 24h, 3-day, and 7-day message drafts and optional in-memory scheduling.

## Architecture

```
Lead created
    → Schedule follow-ups (in-memory: 24h, 3d, 7d)
    → Coordinator uses admin UI to generate drafts
    → Copy / Open WhatsApp → manual send
```

## Components

### 1. `lib/ai/lead-copilot.ts`

- **generateFollowUp24h(input)** — 24h check-in draft
- **generateFollowUp3Day(input)** — 3-day soft follow-up
- **generateFollowUp7Day(input)** — 7-day final check-in

All take `LeadCopilotInput` and return `Promise<string | null>`.

### 2. `lib/followup/lead-followup.ts`

- **mapLeadToCopilotInput(lead)** — maps a DB lead row to `LeadCopilotInput`
- **generate24hFollowup(lead)** / **generate3dFollowup(lead)** / **generate7dFollowup(lead)** — wrappers that call the copilot
- **scheduleFollowups(leadCreatedAt)** — returns `{ at24h, at3d, at7d }` as `Date` (in-memory only; no DB writes)

### 3. API `POST /api/admin/leads/[id]/followup`

- **Body:** `{ type: "24h" | "3d" | "7d" }`
- **Response:** `{ message: string, schedule: { at24h, at3d, at7d } }` (ISO strings)
- Admin-only; fetches lead and generates the requested draft.

### 4. Admin UI (lead detail page)

- **Follow-ups** section: three blocks (24h, 3 day, 7 day).
- Each: **Generate** → shows message → **Copy** and **Open WhatsApp** (when lead has phone).

## Scheduling (in-memory)

- **scheduleFollowups(createdAt)** computes suggested send times:
  - 24h = createdAt + 24 hours
  - 3d = createdAt + 3 days
  - 7d = createdAt + 7 days
- No DB schema changes. Use these values to show coordinators when to follow up or to drive future reminders/cron.

## Usage

1. Open a lead in admin → scroll to **Follow-ups**.
2. Click **Generate** for 24h, 3d, or 7d.
3. Copy the draft or click **Open WhatsApp** (if phone is set) to send manually.

## Safety

- No automatic sending; all follow-ups are coordinator-initiated.
- Reuses existing AI copilot and auth; no new migrations or RLS.
