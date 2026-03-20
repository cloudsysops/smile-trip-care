## Private Beta Runbook

### 1. Scope

This runbook describes how to operate the platform during the **private beta**:

- Who can access it.
- Which flows must work.
- How to collect and review feedback.
- What to monitor before inviting more testers.

### 2. Environments

- **QA / Private beta host**
  - Vercel project with:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
  - Supabase project with:
    - All migrations applied, including:
      - `patient_pipeline`
      - `profile_roles`
      - `beta_feedback`
      - `stripe_webhook_events`.

### 3. Critical flows to verify regularly

1. **Auth**
   - `/login` → `/patient` or `/admin/overview` depending on role.
   - `/api/auth/me` returns `200` for logged-in users.

2. **Assessment**
   - Landing → `/assessment` → submit → `/assessment/proposal`.
   - Lead appears in `/admin/leads`.

3. **Payment**
   - From proposal, start deposit checkout.
   - Stripe test payment succeeds.
   - Stripe webhook updates:
     - `payments.status = 'succeeded'`
     - `leads.status = 'deposit_paid'`
     - `bookings.status = 'deposit_paid'` (if present).
   - `/patient` shows “Deposit received” state for the journey.

4. **Feedback**
   - “Send feedback” button visible on:
     - `/patient`
     - `/assessment`
     - `/admin/overview`
   - Feedback is saved and visible in `/admin/feedback`.

### 4. Who is allowed in the private beta

- **Admin / internal**
  - Cristian and trusted collaborators with `profiles.role = 'admin'`.
  - Responsibilities:
    - Monitor `/admin/overview` and `/admin/feedback`.
    - Validate Stripe and webhook behavior.

- **Patients / testers**
  - Selected individuals invited by Cristian.
  - Use normal signup / login flow.

### 5. Feedback loop

1. **On the product**
   - Encourage testers to use the “Send feedback” button when:
     - Something is confusing.
     - A step feels slow or scary.
     - They’re delighted and want to say why.

2. **For Cristian / admin**
   - Check `/admin/feedback` at least daily during active testing.
   - Triage feedback into:
     - Urgent bugs (blockers).
     - High-impact UX changes.
     - Nice-to-have improvements.
   - Log decisions and next steps in Notion or `docs/NEXT_TASKS.md`.

### 6. When to halt invites

Pause new testers if any of these are true:

- Stripe webhook failures or payments not reflected in the dashboard.
- Login or assessment becomes unreliable.
- Database migration or environment drift is suspected.

Use the observability docs:

- `docs/PRODUCTION_OBSERVABILITY_BASELINE.md`
- `docs/FUNNEL_ANALYTICS_PLAN.md`

### 7. Exit criteria for “Private beta” → “Public beta”

- At least one complete **test sale** verified end-to-end.
- Auth, assessment, and payment flows stable across multiple testers.
- Feedback in `/admin/feedback` shows:
  - No repeated critical confusion on the main flows.
  - No unaddressed severe trust issues.
- Stripe + Supabase + Vercel environments verified using:
  - `docs/DEPLOY_CHECKLIST.md`
  - `docs/GO_LIVE_READINESS_REPORT.md` (see next doc).

