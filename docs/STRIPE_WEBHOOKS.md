# Stripe Webhooks Setup

This project expects Stripe webhook events at:

`POST /api/stripe/webhook`

## 1) Create webhook endpoint in Stripe

1. Stripe Dashboard -> Developers -> Webhooks -> Add endpoint.
2. Endpoint URL:
   - Production: `https://<your-domain>/api/stripe/webhook`
   - Local (via Stripe CLI): `http://localhost:3000/api/stripe/webhook`
3. Subscribe at minimum to:
   - `checkout.session.completed`

## 2) Set webhook secret

Copy signing secret (`whsec_...`) and set:

- `STRIPE_WEBHOOK_SECRET`

Also ensure:

- `STRIPE_SECRET_KEY`
- `STRIPE_API_VERSION` (recommended: `2026-02-25.clover`)

## 3) Local testing with Stripe CLI

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use test card:

- `4242 4242 4242 4242`

## 4) Implementation notes

- Handler verifies signature using raw body (`request.text()`).
- Error responses are safe JSON without stack traces.
- Processing is idempotency-friendly:
  - Unknown sessions are acknowledged and logged.
  - Already-succeeded payments are acknowledged without duplicate state transitions.

## 5) Troubleshooting

- `400 Missing signature` -> webhook request is not from Stripe or header missing.
- `400 Invalid signature` -> wrong `STRIPE_WEBHOOK_SECRET`.
- `500` -> verify env vars and DB connectivity, then inspect server logs by `request_id`.
