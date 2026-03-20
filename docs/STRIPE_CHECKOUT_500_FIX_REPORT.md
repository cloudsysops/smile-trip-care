# Stripe checkout 500 error — Diagnosis and fix

Date: 2026-03-16  
Route: `POST /api/stripe/checkout`

---

## 1. Exact root cause of the 500

The 500 on `POST /api/stripe/checkout` could only be produced by one of these conditions in the route:

- **Missing Stripe secret key**  
  - `getServerConfig()` returns no `STRIPE_SECRET_KEY`.  
  - Previously: returned `{ error: "Stripe not configured" }` with status 500 but without explicit logging.  
  - Now: logs `stripe/checkout: STRIPE_SECRET_KEY missing` with a `request_id`, and returns a clear 500 message.

- **Supabase read/write errors** (rare in QA compared to env issues)  
  - Lead lookup: error from `supabase.from("leads")` when verifying the lead.  
  - Package lookup: error from `supabase.from("packages")` when loading pricing.  
  - Payment insert: error when inserting into `payments`.  
  - All are caught and returned as 500 with structured logs.

- **Stripe session creation failure**  
  - Network or config issue when calling `stripe.checkout.sessions.create(...)`.  
  - Previously: would bubble into the generic catch and return 500 with a generic message.  
  - Now: explicitly logged and mapped to a 502 with a clear message.

In the QA environment that showed `500` immediately upon `POST /api/stripe/checkout`, the **most likely root cause** is:

> `STRIPE_SECRET_KEY` missing or invalid in the Vercel environment used by QA.

This is the only prerequisite the route checks **before** doing any DB or Stripe work.

---

## 2. Exact files changed

| File | Change |
|------|--------|
| `app/api/stripe/checkout/route.ts` | Added structured, minimal logging and clearer error handling around Stripe config, lead/package lookup, session creation, and payment insert. No behavior change to happy path. |
| `app/api/auth/me/route.ts` | Reverted a test-breaking diagnostic (`getCurrentUser()` call outside request scope); kept original 401 logging, now with `request_id`. |

---

## 3. Exact code patches (behavioral highlights)

### 3.1 Stripe config check and logging

Before:

- Checked `config.STRIPE_SECRET_KEY`, returned 500 JSON error if missing, **no log**.

Now:

- Logs explicit config failure and returns a clear error:

```ts
const config = getServerConfig();
if (!config.STRIPE_SECRET_KEY) {
  log.error("stripe/checkout: STRIPE_SECRET_KEY missing");
  return NextResponse.json(
    { error: "Stripe not configured. Contact support.", request_id: requestId },
    { status: 500 },
  );
}
```

### 3.2 Request + lead/package diagnostics

- On entry, the route logs a high-level message:

```ts
log.info("stripe/checkout: request received", {
  request_id: requestId,
  lead_id: undefined,
  actor_role: ctx.profile.role,
});
```

- After parsing the body, it logs the lead and actor role:

```ts
log.info("stripe/checkout: parsed body", {
  request_id: requestId,
  lead_id,
  actor_role: ctx.profile.role,
});
```

- Lead/package Supabase errors now have clearer log messages (prefixed with `stripe/checkout:`) and still return 500.

### 3.3 Stripe session creation error handling

Before:

- `await stripe.checkout.sessions.create(...)` ran inside the main `try`; any error would hit the generic catch and return 500 with a generic message.

Now:

- Wrapped in a nested `try/catch` with a more specific error and status:

```ts
let session;
try {
  session = await stripe.checkout.sessions.create({ ... });
} catch (stripeErr) {
  log.error("stripe/checkout: Stripe session creation failed", {
    error: stripeErr instanceof Error ? stripeErr.message : String(stripeErr),
    lead_id,
  });
  return NextResponse.json(
    { error: "Stripe checkout unavailable. Please try again later.", request_id: requestId },
    { status: 502 },
  );
}
```

### 3.4 Payment persistence logging

- Payment insert failure now logs with a specific prefix:

```ts
if (error) {
  log.error("stripe/checkout: failed to persist checkout session", { error: error.message, lead_id });
  return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
}
```

---

## 4. Exact env vars required for `/api/stripe/checkout`

At minimum, the following must be defined for the environment that serves the QA/prod host:

- **Required for checkout route:**
  - `STRIPE_SECRET_KEY` — Stripe API secret key (test mode for QA, live for prod).
  - `NEXT_PUBLIC_SITE_URL` — Used to compute safe `success_url` and `cancel_url` origins (falls back to `request.origin` if missing, but best practice is to set it).

- **Required for the overall Stripe integration (not directly used by this route but required by the platform):**
  - `STRIPE_WEBHOOK_SECRET` — For `/api/stripe/webhook` signature verification.

- **Required for Supabase access (already in place):**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

If `STRIPE_SECRET_KEY` is missing, the route now logs this explicitly and returns:

```json
{ "error": "Stripe not configured. Contact support.", "request_id": "<uuid>" }
```

with HTTP **500**.

---

## 5. Request payload and lookups

### 5.1 Expected request payload

Body (JSON):

```json
{
  "lead_id": "<UUID>",
  "amount_cents": 50000,      // optional; ignored in favor of server pricing
  "success_url": "/patient",  // optional; must be same-origin when resolved
  "cancel_url": "/patient"    // optional; must be same-origin when resolved
}
```

Validation:

- `lead_id` — required, UUID (via `UuidSchema`).
- `amount_cents` — optional, positive int, max `10_000_000` (but server may override).
- `success_url` / `cancel_url` — optional, max length 2000; resolved via `resolveInternalReturnUrl`, must be same-origin as `baseOrigin` (derived from `NEXT_PUBLIC_SITE_URL` or `request.origin`).

### 5.2 Lookups performed

1. **Auth/profile:**
   - `getCurrentProfile()` — ensures user is authenticated and either admin or patient.
2. **Lead validation:**
   - `leads` by `id` to verify existence and email:
     - For patients: compares lead email with `ctx.profile.email` to enforce “own lead only”.
3. **Package pricing:**
   - `packages` by `slug` (`recommended_package_slug ?? package_slug`) to resolve:
     - `packageName` (for Stripe `product_data.name`).
     - `deposit_cents` (server-side `resolvedAmountCents`).
   - Falls back to `FALLBACK_DEPOSIT_CENTS` (50_000) if no deposit set.
4. **Lead status:**
   - Re-reads `leads.status` to avoid creating sessions for `deposit_paid` leads.
5. **Payments insert:**
   - Inserts a row in `payments` with:
     - `lead_id`
     - `stripe_checkout_session_id`
     - `amount_cents`
     - `status = "pending"`

---

## 6. Verify result

After the changes:

- `npm run verify`:
  - **Lint:** Pass.
  - **Tests:** 23 files, 69 tests (including `tests/stripe-checkout-api.test.ts`) — pass.
  - **Build:** `next build` passes when run without a stale `.next/lock` (lock removal is a separate local concern, not a code issue).

The checkout route remains fully covered by existing tests, including:

- Rejecting external return URLs.
- Using server-side amount (ignoring client-provided `amount_cents`).
- Handling lead not found / deposit already paid cases.

---

## 7. How to confirm in QA

1. Ensure `STRIPE_SECRET_KEY` is set correctly in the QA environment (Vercel → Project → Environment Variables).
2. Click the **“Pay deposit”** CTA (patient or admin):
   - The browser sends `POST /api/stripe/checkout`.
   - On success, the response JSON should include a `url` to Stripe Checkout.
3. If it still fails:
   - Check logs for:
     - `stripe/checkout: STRIPE_SECRET_KEY missing`
     - `stripe/checkout: failed to validate lead before checkout`
     - `stripe/checkout: failed to load package pricing`
     - `stripe/checkout: Stripe session creation failed`
     - `stripe/checkout: failed to persist checkout session`
   - Use the `request_id` from the JSON error to correlate frontend and backend logs.

With the logging and error mapping now in place, any remaining 500s from `/api/stripe/checkout` are diagnosable without further code changes.

