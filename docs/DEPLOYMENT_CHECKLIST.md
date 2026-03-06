# Deployment Readiness Checklist

Checklist operativo para despliegues con GitHub + Vercel + Supabase + Stripe.

## 1) Deployment checklist

### GitHub / CI
- [ ] Branch protegida (`main`) con check obligatorio: `CI`.
- [ ] Último commit en `main` con `lint`, `test` y `build` en verde.
- [ ] No hay secretos en commits ni en archivos trackeados (`.env.local` no versionado).

### Vercel
- [ ] Proyecto conectado al repo correcto.
- [ ] Auto-deploy habilitado (Production: `main`, Preview: PRs/branches).
- [ ] Variables de entorno configuradas por entorno (Production/Preview).
- [ ] Variables outbound opcionales configuradas si aplica (`RESEND_API_KEY`, `OUTBOUND_EMAIL_FROM`, `OUTBOUND_WHATSAPP_API_*`).
- [ ] Deploy más reciente en estado `Ready`.

### Supabase
- [ ] Migraciones aplicadas (`0001` → `0008` según `STATUS.md`).
- [ ] RLS habilitado y policies validadas.
- [ ] Claves correctas en Vercel (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, públicas `NEXT_PUBLIC_*`).

### Stripe
- [ ] `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` configuradas en Vercel.
- [ ] Endpoint de webhook configurado a `/api/stripe/webhook`.
- [ ] Evento `checkout.session.completed` habilitado.
- [ ] Se probó pago de prueba y webhook procesado con éxito.

### Monitoring / operación
- [ ] `/api/health` responde 200.
- [ ] `/api/health/ready` responde 200 con `ready: true`.
- [ ] Alertas/log review: sin errores críticos tras el deploy.

## 2) Configuration changes (repo)

- `.github/workflows/ci.yml`
  - Se agregó `workflow_dispatch`.
  - Se agregó `concurrency` para cancelar jobs anteriores en la misma ref.
  - Se definieron placeholders válidos de env para `build` (sin secretos).
- `.gitignore`
  - Se permite versionar solo `.env.example` y `.env.local.example`.
- `.env.example` y `.env.local.example`
  - Plantillas versionadas con variables de Supabase, Stripe, OpenAI y rate limit.
- `vercel.json`
  - Cron jobs definidos para `followups`, `automation worker` y `outbound worker`.
- `docs/VERCEL_DEPLOY.md`
  - Ruta de webhook corregida a `/api/stripe/webhook`.
  - Guía extendida con variables opcionales de AI y verificación post-deploy.

## 3) Verification steps

1. **CI local**
   ```bash
   npm ci
   npm run lint
   npm run test
   npm run build
   ```
2. **Health endpoints (post deploy)**
   ```bash
   curl -sS https://<your-domain>/api/health
   curl -sS https://<your-domain>/api/health/ready
   ```
3. **Stripe webhook (local)**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   stripe trigger checkout.session.completed
   ```
4. **Verificación de datos**
   - `payments.status = succeeded`
   - `leads.status = deposit_paid`
5. **Logs**
   - Revisar Vercel Functions logs para errores 4xx/5xx y fallos de firma de webhook.
6. **Outbound command center**
   - Confirmar acceso admin a `/admin/outbound`.
   - Confirmar `GET /api/admin/outbound/metrics` y `/api/admin/outbound/queue` con sesión admin.
7. **Outbound worker cron**
   - Confirmar invocación de `/api/automation/outbound-worker` con secret válido y ejecución sin 5xx.
