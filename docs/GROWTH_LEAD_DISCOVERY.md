# Growth: Lead Discovery Engine

This document describes the **Lead Discovery Engine** that finds people asking about dental implants, veneers, and dental tourism on Reddit and prepares AI-generated replies that guide them to the assessment funnel.

## Architecture

```
Internet → Reddit / Forums
    → Lead discovery script (scripts/growth/reddit-lead-discovery.ts)
    → AI response generator (lib/ai/reddit-responder.ts)
    → CLI (scripts/growth/find-leads.ts)
    → data/reddit-leads.json
    → Manual or future outbound → Assessment link
```

## Components

### 1. Reddit discovery (`scripts/growth/reddit-lead-discovery.ts`)

- **Subreddits:** r/dentalimplants, r/veneers, r/dentistry, r/medicaltourism, r/cosmeticsurgery
- **Keywords:** implant, veneers, hollywood smile, dentist cost, dental tourism, teeth abroad
- Uses Reddit’s public JSON API (no auth). A descriptive `User-Agent` is set to comply with Reddit’s guidelines.
- **Output shape:** `{ post_title, post_url, subreddit, author, created_at, summary }`

### 2. AI responder (`lib/ai/reddit-responder.ts`)

- **Input:** `post_title` + `summary`
- **Output:** Short, helpful reply (2–4 sentences) that ends with:
  - *“If you're exploring treatment abroad, you can estimate options here: [assessment URL]”*
- Uses `OPENAI_API_KEY`. Assessment URL is configurable via `NEXT_PUBLIC_ASSESSMENT_URL` (default: dev Vercel assessment URL).

### 3. CLI (`scripts/growth/find-leads.ts`)

- **Command:** `npm run growth:leads`
- Fetches posts from all subreddits, filters by keywords, keeps **top 10** by date.
- If `OPENAI_API_KEY` is set, generates a `draft_reply` for each post.
- Writes results to **`data/reddit-leads.json`** (gitignored).

### 4. Output file (`data/reddit-leads.json`)

- Array of objects: `post_title`, `post_url`, `subreddit`, `author`, `created_at`, `summary`, and optionally `draft_reply`.
- Use this file to manually reply on Reddit or to feed a future outbound/automation step.

## Usage

1. **Discovery only (no API key):**
   ```bash
   npm run growth:leads
   ```
   Produces `data/reddit-leads.json` with post metadata and no `draft_reply`.

2. **Discovery + AI drafts:**
   ```bash
   export OPENAI_API_KEY=sk-...
   npm run growth:leads
   ```
   Same file with `draft_reply` populated for each of the top 10 posts.

3. **Custom assessment URL (e.g. production):**
   Set `NEXT_PUBLIC_ASSESSMENT_URL` in the environment before running the script (or in `.env.local` when running via Next.js). The Reddit responder uses it in the CTA.

## Safety and compliance

- **Reddit:** Read-only use of the public API. Set a clear, non-misleading User-Agent. Do not automate posting without reviewing Reddit’s rules and automation guidelines.
- **Replies:** Intended for human review before posting. Do not auto-post AI replies.
- **Data:** `data/reddit-leads.json` is gitignored; do not commit it if it contains drafts you consider sensitive.

## Future extensions

- Add more subreddits or keywords in `reddit-lead-discovery.ts`.
- Optional: Google/forum discovery scripts following the same output shape.
- Optional: Store results in DB and surface “posts to respond” in admin.
- Optional: One-click “Copy draft” or “Open Reddit post” from an admin view.
