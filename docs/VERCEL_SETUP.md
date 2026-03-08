# Vercel setup — Nebula Smile

Deploy and environment configuration. **No credentials are created by scripts.** CLI login is your manual step when needed.

---

## CLI (optional)

### Login (when using CLI)

**You must run:**

```bash
vercel login
```

Verify: `vercel whoami`

### Deploy from CLI

From repo root:

```bash
vercel          # preview deploy
vercel --prod   # production (use with care)
```

---

## Expected environment variables (Vercel)

Set in Vercel Project → Settings → Environment Variables (Production and Preview as needed).

### Required for build and runtime

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_URL` | Yes | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signing secret (after adding endpoint) |

### Optional

| Variable | Notes |
|----------|--------|
| `OPENAI_API_KEY` | AI features |
| `OPENAI_MODEL` | e.g. gpt-4o-mini |
| `AUTOMATION_CRON_SECRET` | Cron/worker auth |
| `CRON_SECRET` | Alias for above |
| `DATABASE_URL` | Only if running migrations from Vercel (rare) |
| `RATE_LIMIT_PROVIDER` | `memory` or `upstash` |
| `UPSTASH_REDIS_REST_URL` | If using Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | If using Upstash |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp CTA |

See [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md) and `.env.example` for full list.

---

## Deploy verification

1. **Build:** Vercel build must succeed (runs `npm run build` with env).
2. **Health:** After deploy, check:
   - `GET https://<your-deployment>/api/health` → 200, `{"ok":true}`
   - `GET https://<your-deployment>/api/health/ready` → 200
3. **Script:** From repo:
   ```bash
   ./scripts/deploy_verify.sh https://your-app.vercel.app
   ```

---

## Webhook and redeploy

If you add or change `STRIPE_WEBHOOK_SECRET` (or any env) after a deploy, trigger a **Redeploy** in Vercel so the new value is used.

---

## References

- [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) — full deploy checklist
- [CONECTAR_SUPABASE_VERCEL.md](CONECTAR_SUPABASE_VERCEL.md) — connecting Supabase and Vercel
