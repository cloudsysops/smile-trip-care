# Custom domain setup — nebulasmile.com (Vercel)

**Goal:** Attach **nebulasmile.com** to the Nebula Smile Vercel deployment.

**Risk:** SAFE. No Supabase, Stripe, or schema changes.

---

## 1. Add domain in Vercel

1. Go to [vercel.com](https://vercel.com) → your **Team** → select the **Nebula Smile project**.
2. Open **Settings** → **Domains**.
3. Click **Add** and add:
   - `nebulasmile.com`
   - `www.nebulasmile.com`
4. Save. Vercel will show the DNS records you need (or “Invalid Configuration” until DNS is set).

---

## 2. Configure DNS

At your DNS provider (Namecheap, GoDaddy, Cloudflare, etc.), add:

| Type  | Name / Host | Value / Target           | TTL (optional) |
|-------|-------------|--------------------------|----------------|
| **A** | `@`         | `76.76.21.21`            | 300 or default |
| **CNAME** | `www`   | `cname.vercel-dns.com`   | 300 or default |

- **A record** — root domain (`nebulasmile.com`) → Vercel’s IP.
- **CNAME** — `www.nebulasmile.com` → Vercel.

**Notes:**
- Some providers use “@” for root; others leave the host blank for the apex.
- If your provider only allows CNAME for `www`, use exactly `cname.vercel-dns.com`.
- Cloudflare: turn **Proxy** off (grey cloud) for the A and CNAME during setup if Vercel doesn’t validate; you can try proxy after.

---

## 3. Verify domain in Vercel

1. Stay in **Vercel** → **Settings** → **Domains**.
2. Wait for DNS propagation (minutes to a few hours).
3. When status for both `nebulasmile.com` and `www.nebulasmile.com` shows **Valid Configuration**, proceed.

If it stays “Invalid”:
- Double-check A and CNAME values and host names.
- Use `dig nebulasmile.com` and `dig www.nebulasmile.com` to confirm they resolve as expected.

---

## 4. Set primary production domain

1. In **Settings** → **Domains**, find the domain you want as primary (e.g. **nebulasmile.com**).
2. Use the **⋮** menu or “Set as primary” / “Primary” toggle so that production is served at:
   - **https://nebulasmile.com**
3. Ensure **www.nebulasmile.com** redirects to **nebulasmile.com** (or the opposite), per Vercel’s options for the www domain.

---

## 5. Update environment variables

1. **Vercel** → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://nebulasmile.com`
   - **Environments:** Production (and Preview if you want).
3. Save.
4. **Redeploy:** **Deployments** → latest deployment → **⋮** → **Redeploy** (so the new env is picked up).

---

## 6. Test routes

After the domain shows **Valid Configuration** and the redeploy is done, test:

| Route | URL | Expected |
|-------|-----|----------|
| Home | https://nebulasmile.com/ | 200, landing loads |
| Packages | https://nebulasmile.com/packages | 200 |
| Assessment | https://nebulasmile.com/assessment | 200 |
| Health API | https://nebulasmile.com/api/health | 200, JSON with `ok: true` |

**From terminal:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://nebulasmile.com/
curl -s -o /dev/null -w "%{http_code}\n" https://nebulasmile.com/packages
curl -s -o /dev/null -w "%{http_code}\n" https://nebulasmile.com/assessment
curl -s -o /dev/null -w "%{http_code}\n" https://nebulasmile.com/api/health
```

Each should output `200`.

---

## Checklist

| Step | Action | Done |
|------|--------|------|
| 1 | Vercel → Settings → Domains → Add `nebulasmile.com` and `www.nebulasmile.com` | |
| 2 | DNS: A `@` → `76.76.21.21`; CNAME `www` → `cname.vercel-dns.com` | |
| 3 | Wait until Vercel shows **Valid Configuration** for both domains | |
| 4 | Set **nebulasmile.com** as primary production domain | |
| 5 | Add `NEXT_PUBLIC_APP_URL=https://nebulasmile.com` in Vercel; Redeploy | |
| 6 | Test `/`, `/packages`, `/assessment`, `/api/health` return 200 | |

---

## Stripe webhook (reminder)

After the custom domain is live, if you use Stripe in production:

- In **Stripe Dashboard** → **Developers** → **Webhooks**, set the endpoint URL to:
  - `https://nebulasmile.com/api/stripe/webhook`
- No code changes required; env and DNS only.

---

**Do NOT modify:** Supabase config, Stripe keys in code, database schema.
