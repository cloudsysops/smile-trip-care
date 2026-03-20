# Growth Engine Architecture — Smile Transformation Platform

**Goal:** Turn the Smile Transformation Platform into a machine that continually discovers potential patients, engages them with helpful replies, and feeds them into the existing assessment → lead → consultation → deposit funnel.

---

## 1. High-level pipeline

Internet (Reddit, Twitter, forums, etc.)  
→ **Lead discovery** (scrapers or manual discovery)  
→ `external_leads` concept  
→ **AI responder** (suggested replies)  
→ Patient clicks assessment link  
→ `/assessment` (Smile)  
→ `leads` table (Smile)  
→ `/admin/leads` + consultations  
→ deposit / booking

---

## 2. Status pipeline (external leads)

For each external conversation/post we care about, we treat it as an **external lead** with a simple status pipeline:

- `discovered` — found a post that looks relevant (e.g. “implants cost too high in the US”).  
- `replied` — we have answered or prepared an answer.  
- `assessment_sent` — we sent a link to the Smile assessment (or asked them to take it).  
- `converted_to_lead` — the person completed the assessment and we can link this external lead to a Smile `lead` row.  
- `ignored` — not a good fit or intentionally skipped.

In this sprint, we do **not** change schema or create migrations. This pipeline is implemented in code as mock data and documentation only, so the product team can validate the UX and flow before wiring real scrapers or tables.

---

## 3. Admin Harvester (UI concept)

**Route:** `/admin/harvester`

**Purpose:** Give the admin/growth operator a single place to:

- See external conversations about dental treatments (mocked for now).  
- Understand where each conversation is in the pipeline (status).  
- Get a suggested reply (via AI helper) inviting the user to take the Smile assessment.  
- Eventually, track which conversations became actual Smile leads.

**Implementation (current):**

- Uses existing dashboard system:
  - `AdminShell`
  - `DashboardLayout`, `DashboardSection`
  - `StatCard`
  - `DataTable`
  - `EmptyState`

- Uses **mock data** for now (`ExternalLead` type with fields: `id`, `source`, `content`, `keyword`, `status`, `created_at`).

- StatCards:
  - **Discovered**: count of `status === "discovered"`.  
  - **Replied**: count of `status === "replied"`.  
  - **Assessment sent**: count of `status === "assessment_sent"`.  
  - **Converted**: count of `status === "converted_to_lead"`.

- DataTable columns:
  - `source` — e.g. `reddit/r/dentistry`, `twitter`.  
  - `content` — a snippet of the external post.  
  - `keyword` — how we found it (e.g. `dental implants cost`).  
  - `status` — current pipeline status.  
  - `created_at` — when we discovered it.  
  - `actions` — buttons for “Generate reply”, “Copy reply”, “Mark replied” (UI only at this stage).

**Future wiring (not implemented yet):**

- Backing this UI with a real `external_leads` table once the schema is approved.  
- Integrating scraper jobs or n8n workflows to populate external_leads automatically.  
- Allowing operators to link an external lead to a Smile `lead` (`converted_to_lead`) when an assessment is completed.

---

## 4. AI responder helpers (Layer 0 and Layer 1)

### 4.1 Deterministic responder (Layer 0)

**File:** `lib/growth/aiResponder.ts`

**Function:**  
`generateSuggestedReply(postText: string, keywordHint?: string): string`

**Responsibility:**

- Take the raw text of a post (e.g. from Reddit or Twitter).  
- Return a friendly, patient-oriented reply template that:
  - acknowledges their situation,
  - explains that high-quality dental treatment can be done in Colombia at lower cost,
  - invites them to a **free Smile assessment**,
  - includes the current assessment URL:
    - `https://smile-transformation-platform-dev.vercel.app/assessment`
- Lightly adapts copy based on simple keyword detection (implants, veneers, dentures).

**Behavior:**

- Pure TypeScript helper, **no external API calls**.  
- Used by the Harvester page to show a “Suggested reply” block under each external lead’s content.  
- Operators can manually copy/adapt this reply and post it in the original channel (Reddit, etc.).

### 4.2 AI Layer 1 — Provider wrapper and AI responder

**Provider wrapper:**  
**File:** `lib/ai/provider.ts`

- Reads `OPENAI_API_KEY` from env.
- Provides a small helper:
  - `generateText(prompt: string, options?): Promise<{ ok: boolean; text: string | null; fallbackReason?: string }>`  
- Uses an OpenAI-compatible chat completion endpoint (default model: `gpt-4.1-mini`).
- Fails safely:
  - If `OPENAI_API_KEY` is missing, returns `{ ok: false, text: null, fallbackReason: "OPENAI_API_KEY not configured" }`.
  - On network/provider errors or invalid responses, logs internally and returns `ok: false` with a `fallbackReason`.
  - **Never throws** for the caller.

**AI responder module:**  
**File:** `lib/ai/aiResponder.ts`

- Exports:
  - `generateAiReplyForHarvester(postText: string, keyword?: string)` → `{ reply: string; fallbackUsed: boolean; fallbackReason?: string }`
- Behavior:
  - Builds a concise system+user prompt that:
    - keeps replies short (< 6 sentences),
    - stays non-spammy and avoids clinical promises,
    - always includes the **free assessment CTA**:
      - `https://smile-transformation-platform-dev.vercel.app/assessment`
  - Calls `generateText` from `lib/ai/provider.ts`.
  - If the provider succeeds:
    - returns the model’s reply with `fallbackUsed: false`.
  - If the provider fails or is not configured:
    - falls back to `generateSuggestedReply` from `lib/growth/aiResponder.ts` (deterministic helper),
    - returns that reply with `fallbackUsed: true` and a `fallbackReason`.

This ensures that AI-generated replies are **optional** and that the system always has a safe deterministic baseline.

---

## 5. Data model considerations (future)

When you’re ready to persist external leads, a simple table (not created in this sprint) might look like:

```text
external_leads
-------------
id
source           -- e.g. "reddit/r/dentistry"
username         -- if available
post_url         -- link to the original post
content          -- text snippet
keyword          -- search term that found it
status           -- discovered / replied / assessment_sent / converted_to_lead / ignored
lead_id          -- nullable, points to leads.id when converted
created_at
updated_at
```

This table would let you:

- filter by channel/source;  
- see which conversations led to actual Smile leads;  
- compute conversion by channel and by keyword.

No schema changes are made in this sprint; this is only documented here for future sprints.

---

## 6. AI Layer 1 — API route and /admin/harvester integration

### 6.1 Reply suggestion API

**Route:** `POST /api/ai/reply-suggestion`  
**File:** `app/api/ai/reply-suggestion/route.ts`

- Auth:
  - Uses `requireAdmin()` to restrict usage to admin users.
- Input (JSON body):
  - `{ postText: string, keyword?: string }`
  - Validated with `zod`:
    - `postText`: required, non-empty string, length-limited.
    - `keyword`: optional short string.
- Output (on success):
  - `{ reply: string, fallbackUsed: boolean }`
- Failure modes:
  - `401` — Unauthorized (not admin).
  - `400` — Invalid JSON or validation error (clear error message).
  - `500` — Provider or internal error:
    - Returns user-safe message:
      - `"Could not generate reply. Please try again or use the template reply."`
    - Logs details server-side via `createLogger`.

### 6.2 /admin/harvester UI integration

Files:

- `app/admin/harvester/page.tsx`
- `app/admin/harvester/HarvesterActions.tsx` (client component)

Behavior:

- The **Content** column in the `DataTable` continues to show the **deterministic** template reply using `generateSuggestedReply(...)`, so operators always have a baseline suggestion.
- The **Actions** column now renders `HarvesterActions`, which:
  - Provides a “Generate AI reply” button:
    - Calls `POST /api/ai/reply-suggestion` with `postText` and `keyword`.
    - Shows loading and error states.
    - Displays the AI-generated reply (or deterministic fallback) when available, with a small note if template fallback was used.
  - Provides a “Copy reply” button:
    - Copies the AI reply if present; otherwise copies the deterministic reply.
  - “Mark replied” persists to file via `POST /api/admin/harvester/mark-replied` (see Phase 1.5).
  - Keeps “Open post” linking to the external URL in a new tab.
- All AI behavior is:
  - **Non-blocking** — `/admin/harvester` works even if the AI provider is misconfigured or down.
  - **Suggestion-only** — no automatic posting or status changes.

### 6.3 Required environment variable

To enable AI Layer 1, set in the environment (local + Vercel):

- `OPENAI_API_KEY` — API key for an OpenAI-compatible provider.

If this variable is **not** set:

- `lib/ai/provider.ts` returns `ok: false` with a clear `fallbackReason`.
- `lib/ai/aiResponder.ts` transparently falls back to the deterministic `generateSuggestedReply`.
- `/api/ai/reply-suggestion` still returns a valid `{ reply, fallbackUsed: true }`, so the UI remains fully usable.

---

## 7. Harvester Phase 1.5 (filters, mark replied, score UX, AI count)

**Scope:** Operator-friendly cockpit without DB or schema changes.

### 7.1 Filters (client-side only)

- **File:** `app/admin/harvester/HarvesterTableWithFilters.tsx` (client component).
- **Filters:** Source, Status, Score (All / high / medium / low).
- **Behavior:** Filters are applied client-side on the loaded `leads` array. Stat cards at the top always reflect **full** data; the table shows filtered rows and a “Showing X of Y” hint.

### 7.2 Mark replied (file-based persistence)

- **State file:** `data/harvester_state.json` — keyed by external lead `id`, value `true` when marked replied.
- **Read:** `lib/growth/harvesterState.ts` — `readHarvesterRepliedState()` used on page load.
- **Write:** `POST /api/admin/harvester/mark-replied` — body `{ id: string, replied: boolean }`, admin-only; updates the JSON file.
- **UI:** “Mark replied” toggles to “Replied” and adds a “· Replied (local)” hint in the Status column. State survives refresh (file-based).

### 7.3 Score UX

- **Badges:** High = green border + stronger style; Medium = amber; Low = neutral. Tooltip shows `score_reason` when present.
- **Legend:** A short line above the table explains: **High:** treatment + cost + abroad · **Medium:** treatment + (cost or abroad) · **Low:** weaker signals.

### 7.4 AI usage indicators

- **Per row:** HarvesterActions shows “AI reply (generated)” or “(template used as fallback)” after “Generate AI reply”.
- **Session count:** “AI replies this session: N” appears when at least one AI-generated (non-fallback) reply has been produced in the current session. In-memory only; not persisted.

### 7.5 Follow-up (Phase 2)

- Move to a real `external_leads` table and persist status/score in DB; optional link to `leads.id` when assessment is completed.

---

## 8. Growth Engine phases (roadmap)

**Phase 1 — Groundwork (this sprint):**

- `/admin/harvester` UI with stat cards, table and suggested replies.  
- AI responder helper (`generateSuggestedReply`) with light treatment-specific wording.  
- Documentation of pipeline and architecture.  
- **Reddit harvester script** (`scripts/reddit-harvester.ts`) that:
  - calls `discoverRedditLeads()` from `scripts/growth/reddit-lead-discovery.ts`,
  - fetches recent posts from several subreddits:
    - `dentalimplants`, `veneers`, `dentistry`, `medicaltourism`, `askdentists`, `expats`, `travel`, `cosmeticsurgery`,
  - filters by a small keyword set grouped conceptually into:
    - implants / veneers / dentures,
    - cost/price/too expensive,
    - dental tourism / abroad / Colombia / Mexico,
  - computes a **deterministic lead score** for each post:
    - `high` — mentions treatment (implants/veneers/dentures) + cost concerns + abroad/Colombia/Mexico,
    - `medium` — mentions treatment + (cost OR abroad),
    - `low` — vague or weak intent,
  - writes normalized external lead records to `data/external_leads.json` with fields:
    - `id`, `source`, `content`, `keyword`, `status`, `url`, `created_at`, `score`, `score_reason`,
  - sets `status = "discovered"` by default.

- `/admin/harvester` now attempts to load real harvested data from `data/external_leads.json` and falls back to mock data only if the file is missing or empty.

- npm script: `npm run harvest:reddit` to run the harvester locally.

**Phase 2 — Data & tracking:**

- Introduce `external_leads` table via a migration.  
- Persist `score` and `score_reason` in the DB.  
- Add admin actions to:
  - update status,
  - link to `leads.id` when assessment is completed,
  - record which operator replied / sent assessment.

**Phase 3 — Automation:**

- Add scrapers or n8n flows that:
  - search Reddit/Twitter/forums for configured keywords,  
  - insert `external_leads` rows,
  - optionally propose replies automatically (kept in draft status).

**Phase 4 — Analytics & optimization:**

- Extend `/admin/analytics` to show:
  - leads by source/channel,  
  - conversion from discovered → converted_to_lead → deposit,  
  - top-performing keywords.

---

## 9. How this integrates with existing Smile funnel

Existing internal funnel:

1. `/assessment` → `POST /api/leads` → `leads` row.  
2. `/admin/leads` + admin tools → move lead along statuses (contacted, qualified, deposit_paid, etc.).  
3. Clinical progress + dashboards follow after booking.

The Growth Engine v1 does **not** change this funnel. Instead, it:

- Feeds **more and better-qualified people** into the **assessment** entry point.  
- Makes it easier to operate outreach via `/admin/harvester`.  
- Provides a clear, documented path from external posts to internal leads and, eventually, to bookings and clinical progress.

---

## 10. Operator workflow (current)

Daily loop for a human operator:

1. Run the harvester:
   ```bash
   npm run harvest:reddit
   ```
   This generates/updates `data/external_leads.json` with the latest matching Reddit posts and scores.

2. Log in as admin and open `/admin/harvester`:
   - Review stat cards (Discovered, Replied, Assessment sent, Converted, High-score leads).
   - Scan the table, focusing on `score = "high"` and `score = "medium"`.

3. For each promising row:
   - Click **Open post** to open the Reddit thread.
   - Copy the **Suggested reply** (adapted by `generateSuggestedReply` using the keyword) and paste it into Reddit, optionally tweaking tone/details.
   - Optionally mark the lead as replied in a future Phase 2 (UI-only for now).

This keeps the system **file-based and manual**, but already turns `/admin/harvester` into a practical cockpit for growth, without automation risks.

