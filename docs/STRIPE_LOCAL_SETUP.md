# Stripe local setup — webhook testing

Test Stripe webhooks against your local app without deploying. **You must run `stripe login` yourself** — no credentials are stored in the repo.

---

## Stripe CLI

### Install

- **macOS:** `brew install stripe/stripe-cli/stripe`
- **Other:** [Stripe CLI](https://stripe.com/docs/stripe-cli)

### Login (required for listen)

**You must run:**

```bash
stripe login
```

This opens the browser to link the CLI to your Stripe account. Do not commit any credentials.

---

## Forward webhooks to local app

1. **Start your app** (e.g. `npm run dev` on port 3000).

2. **Start Stripe listener** (forwards events to your app and prints a signing secret):

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Use the webhook signing secret** shown in the CLI output (e.g. `whsec_...`). Set it in `.env.local`:

   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
   ```

4. **Restart your app** so it picks up the new secret (or use a fresh terminal and keep the listener running).

5. **Trigger events** (e.g. complete a test checkout, or use Stripe Dashboard → Developers → Webhooks → your endpoint → Send test webhook for `checkout.session.completed`). With `stripe listen`, events are sent to `localhost:3000/api/stripe/webhook` and the CLI shows delivery status.

---

## Expected env variable usage

| Variable | Local (with stripe listen) | Production |
|----------|----------------------------|------------|
| `STRIPE_WEBHOOK_SECRET` | Use the **temporary** secret printed by `stripe listen` (whsec_...) | Use the **endpoint** signing secret from Stripe Dashboard (webhook endpoint for your production URL) |
| `STRIPE_SECRET_KEY` | Test key (sk_test_...) | Live key (sk_live_...) when going live |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Test key (pk_test_...) | Live key when going live |

---

## Test card (no real charges)

- **Success:** 4242 4242 4242 4242  
- Expiry: any future (e.g. 12/34)  
- CVC: any 3 digits  

---

## Summary

1. Run: `stripe login`
2. Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Put the displayed `whsec_...` into `.env.local` as `STRIPE_WEBHOOK_SECRET`
4. Restart app and trigger a test payment or “Send test webhook” from Dashboard

See [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md) for full Stripe and env docs.
