## Tester Feedback Process

### 1. Goal

Turn private beta feedback into clear, actionable improvements without overwhelming the team.

### 2. How testers submit feedback

- **In-app**
  - Use the “Send feedback” button on:
    - `/assessment`
    - `/patient`
    - `/admin/overview`
  - Short form:
    - What they were trying to do.
    - What felt confusing or broken.
    - Optional email for follow-up.

- **Out of app (optional)**
  - Direct messages or email can be copied into:
    - Notion feedback board, or
    - Manually entered into `/admin/feedback` notes.

### 3. How feedback is stored

- Table: `public.beta_feedback`
  - `page` — where the tester was (e.g. `/assessment`).
  - `message` — free text description.
  - `email` — optional contact.
  - `created_at` — when it was submitted.
  - `category` / `sentiment` — reserved for future use.

- View: `/admin/feedback`
  - Shows:
    - Time, page, category, sentiment, message, email.
  - Admin-only.

### 4. Daily triage (Cristian / admin)

1. Open `/admin/feedback`.
2. For each new item:
   - Decide the severity:
     - **P0 – Blocker**: payment broken, login broken, assessment cannot be submitted.
     - **P1 – High**: user can proceed but experience is confusing or scary.
     - **P2 – Medium**: annoyance or UX polish.
     - **P3 – Low**: copy, visuals, minor ideas.
   - Tag it in your notes (Notion or `NEXT_TASKS.md`).

3. Create tasks:
   - P0: must be fixed before inviting more testers.
   - P1: plan into the next 1–2 sprints.
   - P2/P3: group into themed improvements (UX polish, trust, docs).

### 5. Closing the loop with testers

- When a P0 or P1 item is fixed:
  - If email is present, send a short thank-you note:
    - Acknowledge the issue.
    - Confirm it’s fixed or improved.
    - Invite them to try again.

### 6. What not to do in this phase

- Do not implement large, speculative features based on a single comment.
- Do not change Stripe or auth flows without a clear pattern of issues.
- Do not keep accumulating feedback without triage — it quickly becomes noise.

