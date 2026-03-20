## Go-Live Hardening — Signup Rate Limit & Stripe Webhook Events

### Scope
- Add safe rate limiting to `POST /api/signup`.
- Persist Stripe webhook events to `stripe_webhook_events` for audit, without changing payment behavior.

### Files changed
- `app/api/signup/route.ts`
- `app/api/stripe/webhook/route.ts`

### 1. Signup rate limiting
- **Location**: `app/api/signup/route.ts`
- **Implementation**:
  - Reuses existing `checkRateLimit` helper from `lib/rate-limit`.
  - Extracts caller IP from `x-forwarded-for` (first entry) or `x-real-ip`, falls back to `"unknown"`.
  - If `checkRateLimit(ip)` returns false:
    - Logs `Signup rate limit exceeded` with `{ ip, user_id }`.
    - Returns `429` with `{ error: "Too many requests. Please try again later." }`.
  - Normal success (`200`), unauthorized (`401`), and error (`500`) behaviors are unchanged.
- **Effect**: Protects signup endpoint from abuse/bursts while keeping existing UX and contracts intact.

### 2. Stripe webhook event persistence
- **Location**: `app/api/stripe/webhook/route.ts`
- **Table**: Existing `public.stripe_webhook_events` (from migration `0011_payment_reliability.sql`).
- **When we write**:
  - Only for `checkout.session.completed` events **with**:
    - `mode === "payment"`, and
    - `payment_status === "paid"`.
- **Fields written**:
  - `stripe_event_id`: `event.id`
  - `event_type`: `event.type`
  - `payload_json`: raw request body string (already validated by Stripe)
  - `received_at`: `new Date().toISOString()`
  - `status`: `"received"`
- **Behavior guarantees**:
  - Persistence happens **before** payment lookup/update logic, but after basic event filtering.
  - Any insert error (including unique constraint) is logged as a warning and **does not** change the HTTP response or payment flow.
  - Existing idempotent payment handling via `payments` and `stripe_checkout_session_id` is unchanged.
  - Non-payment or non-paid sessions are still ignored early; tests confirm we do not touch Supabase for those cases.

### 3. Tests
- **Existing tests updated/validated**:
  - `tests/stripe-webhook-api.test.ts`
    - Confirms that non-payment or unpaid sessions do **not** hit Supabase.
    - Confirms that duplicate insert race handling for payments still works.
- **New behavior covered implicitly**:
  - Webhook route now calls `from("stripe_webhook_events")` only for relevant, paid checkout events; tests remain green.

### 4. What was intentionally not touched
- No Stripe checkout logic changed.
- No Stripe webhook payment update logic changed.
- No auth/session logic changed.
- No API request/response shapes were modified (other than the new `429` case for signup on rate limit).
- No new database tables or columns were created.

### 5. Verification result
- `npm run test` — **pass** (23 files, 70 tests).
- `npm run build` — **pass** after cleaning `.next/diagnostics`.
- Lint — only pre-existing warning in `app/debug/roles/page.tsx` (unused eslint-disable).

### 6. Manual first-sale validation checklist
1. **Deploy latest main to QA** (Vercel) and confirm status `Ready`.
2. **Supabase env vars in Vercel**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **Database**:
   - Confirm `stripe_webhook_events` table exists (migration `0011_payment_reliability.sql` applied).
4. **Signup flow**:
   - From QA host, perform normal email/password signup.
   - Confirm profile is created and you can reach `/patient` after login.
   - Hit the signup endpoint several times quickly from the same IP and confirm that after the configured threshold you receive HTTP `429` with the rate limit message.
5. **First sale with Stripe**:
   - From `/assessment` submit a lead, go through proposal → deposit checkout.
   - Complete Stripe Checkout with test card.
   - Verify:
     - Webhook executes without error (Stripe dashboard → logs).
     - `payments` row is `status = 'succeeded'` and linked to the correct `lead_id`.
     - `leads.status` is `deposit_paid`.
     - Any related `bookings` rows are updated to `status = 'deposit_paid'` if present.
6. **Webhook event audit**:
   - In Supabase, query `stripe_webhook_events`:
     - Verify a row exists for the successful checkout event with:
       - `stripe_event_id` matching Stripe’s event.
       - `event_type = 'checkout.session.completed'`.
       - `status = 'received'`.
       - `received_at` close to the webhook timestamp.
7. **Regression checks**:
   - `/login` → `/patient` for patient users.
   - `/login` → `/admin/overview` for the configured admin test user.
   - `/assessment` submission still works.

### 7. Remaining manual steps before marking Deploy ✅
- Founder completes an end-to-end **test sale** in QA:
  - From anonymous visitor → assessment → proposal → deposit → admin dashboard view.
- Confirm Stripe dashboard shows the payment and webhook delivered successfully.
- Confirm `stripe_webhook_events` contains the event row and admin payments metrics page reflects it.
- Decide on final signup rate limit thresholds in `lib/rate-limit` configuration (if not already tuned) based on expected early traffic.

