# Variables de entorno y configuración de Stripe

Resumen de **todas** las variables que necesitas (local y Vercel) y pasos para dejar Stripe listo.

---

## 1. Variables de entorno

### Supabase: dos tipos de conexión

| Variable | Uso | Dónde obtenerla |
|----------|-----|------------------|
| **`SUPABASE_URL`** | App Next.js (cliente Supabase JS): API REST, Auth, Realtime. Ej: `https://ymkqvzanvnbcxisnurle.supabase.co` | Supabase → Project Settings → **API** → **Project URL** |
| **`DATABASE_URL`** | Postgres directo: migraciones (`npm run db:migrate`), seeds (`./scripts/run_seed_marketplace.sh`), scripts con `psql` | Supabase → Project Settings → **Database** → **Connection string** → **URI** (Session o Transaction pooler). Formato: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres` |

La app usa **SUPABASE_URL** + service role para leer/escribir desde API routes y Server Components. Para ejecutar SQL desde terminal (migraciones, seeds) necesitas **DATABASE_URL** (conexión Postgres pura).

### Obligatorias (sin estas el deploy verify falla)

| Variable | Dónde se usa | Dónde obtener el valor |
|----------|--------------|-------------------------|
| `SUPABASE_URL` | Servidor (API, auth, DB) | Supabase → Project Settings → API → **Project URL** |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor (operaciones privilegiadas) | Supabase → Project Settings → API → **service_role** (Reveal) |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente (mismo valor que SUPABASE_URL) | Igual que SUPABASE_URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente (anon public) | Supabase → Project Settings → API → **anon public** (Reveal) |
| `STRIPE_SECRET_KEY` | Servidor (crear sesiones, etc.) | Stripe Dashboard → Developers → API keys → **Secret key** (sk_...) |
| `STRIPE_WEBHOOK_SECRET` | Servidor (validar eventos del webhook) | Después de crear el endpoint en Stripe → Signing secret (whsec_...) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Cliente (Stripe.js / checkout) | Stripe Dashboard → Developers → API keys → **Publishable key** (pk_...) |

**Local:** ponlas en `.env.local` (no subas este archivo a Git).  
**Vercel:** Project → Settings → Environment Variables (Production y Preview si quieres).

### Opcionales

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Necesaria solo para ejecutar migraciones o seeds desde tu máquina (`npm run db:migrate`, `./scripts/run_seed_marketplace.sh`). En Vercel no hace falta. |
| `OPENAI_API_KEY` | Si usas IA en producción |
| `OPENAI_MODEL` | Ej: `gpt-4o-mini` |

---

## 2. Organizar Stripe (checklist)

### Paso A — Claves de API

1. Entra en [dashboard.stripe.com](https://dashboard.stripe.com).
2. Arriba a la derecha elige **Test** (pruebas) o **Live** (cobros reales).
3. Menú **Developers** → **API keys**.
4. Copia:
   - **Publishable key** (pk_...) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (sk_...) → Reveal y copiar → `STRIPE_SECRET_KEY`

Añade esas dos en `.env.local` y en Vercel (Environment Variables). No necesitas aún el webhook secret.

### Paso B — Webhook (para que los pagos actualicen tu base de datos)

1. En Stripe: **Developers** → **Webhooks** → **Add an endpoint**.
2. **Endpoint URL:**  
   `https://smile-transformation-platform-dev.vercel.app/api/stripe/webhook`  
   (usa tu URL real de Vercel; sin barra al final).
3. **Eventos:** marca **`checkout.session.completed`** (y otros que use tu app si los tienes).
4. **Add endpoint**.
5. En la página del endpoint, en **Signing secret** → **Reveal** → copia el valor (whsec_...).

### Paso C — Añadir el webhook secret

- **Local:** en `.env.local` añade `STRIPE_WEBHOOK_SECRET=whsec_...`.
- **Vercel:** Settings → Environment Variables → añade `STRIPE_WEBHOOK_SECRET` con ese valor → guardar.
- **Redeploy:** Deployments → ⋮ del último deploy → **Redeploy** para que la app use la nueva variable.

### Paso D — Probar el webhook

1. Stripe → Webhooks → tu endpoint → **Send test webhook**.
2. Evento **checkout.session.completed** → Send.
3. Debe aparecer respuesta **200**. Si sale 4xx/5xx: revisa URL, que `STRIPE_WEBHOOK_SECRET` esté en Vercel y que hayas hecho Redeploy.

Desde terminal (con [Stripe CLI](https://stripe.com/docs/stripe-cli)):

```bash
stripe trigger checkout.session.completed
```

---

## 3. Resumen rápido

| Dónde | Qué configurar |
|-------|-----------------|
| **Supabase** | URL + anon key + service_role key (ya lo tienes si el health/ready pasa). |
| **Stripe** | API keys (pk_, sk_) + endpoint webhook → signing secret (whsec_). |
| **.env.local** | Las 7 obligatorias (las 4 de Supabase + las 3 de Stripe). |
| **Vercel** | Las mismas 7; después de añadir `STRIPE_WEBHOOK_SECRET`, Redeploy. |

Si algo falla en el deploy verify por variables, el script te dirá cuáles faltan (ej. `[2/5] Env: MISSING (STRIPE_WEBHOOK_SECRET)`).

**WhatsApp:** Para que el botón "Chat on WhatsApp" abra tu número real, añade en Vercel (y en `.env.local` si desarrollas en local) la variable **`NEXT_PUBLIC_WHATSAPP_NUMBER`** con solo dígitos (ej. `573001234567` para Colombia). Si no está definida, se usa un valor por defecto.

Guía paso a paso completa: [GUIA_PASO_A_PASO_PRODUCCION.md](GUIA_PASO_A_PASO_PRODUCCION.md).
