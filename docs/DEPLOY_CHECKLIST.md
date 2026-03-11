# Checklist: Deploy y verificación en producción

Checklist oficial para el sprint **Deploy & production verification**. Completar en orden antes de dar por cerrado el track Deploy en [STATUS.md](../STATUS.md).

**Resumen go-live:** Ver [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md). **Webhooks por ambiente:** Ver [STRIPE_WEBHOOKS_ENVIRONMENTS.md](STRIPE_WEBHOOKS_ENVIRONMENTS.md).

---

## Pre-requisitos (local)

- [ ] Código actualizado desde `main` (o rama de deploy).
- [x] Ejecutar verificación pre-deploy:  
  `npm run verify`  
  (equivale a: lint → test → build). Debe terminar sin errores. *(Verificado por QA Fase 3.)*
- [ ] Migraciones de Supabase aplicadas en el proyecto de producción; seed de paquetes ejecutado si aplica. Para completar: comprobar en Supabase (SQL Editor o CLI) que las tablas necesarias existen y que el seed de paquetes se ha ejecutado si aplica.

---

## 1. Vercel

- [ ] Conectar el repositorio del proyecto a Vercel ([guía detallada](VERCEL_DEPLOY.md)).
- [ ] Configurar **variables de entorno** en Vercel (Production y, si aplica, Preview):

  | Variable | Requerido | Notas |
  |----------|-----------|--------|
  | `SUPABASE_URL` | Sí | Supabase → Project Settings → API |
  | `SUPABASE_SERVICE_ROLE_KEY` | Sí | Mismo lugar, clave service_role |
  | `NEXT_PUBLIC_SUPABASE_URL` | Sí | Mismo valor que SUPABASE_URL |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anon pública |
  | `STRIPE_SECRET_KEY` | Sí (para pagos) | Stripe → API keys |
  | `STRIPE_WEBHOOK_SECRET` | Sí (tras configurar webhook) | Ver sección 2 |
  | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Sí (para checkout) | Clave pública pk_ |
  | `OPENAI_API_KEY` | Opcional | Solo si usas agentes AI en producción |
  | `OPENAI_MODEL` | Opcional | p.ej. gpt-4o-mini |

- [ ] Realizar el primer deploy desde la rama `main` (o la configurada).
- [ ] Confirmar que el **build** termina sin errores en Vercel.
- [ ] Confirmar que el **sitio carga** correctamente en la URL de producción.

---

## 2. Stripe (webhook)

- [ ] En **Stripe Dashboard** → Developers → Webhooks → Add endpoint:
  - **URL:** `https://<tu-dominio-producción>/api/stripe/webhook`
  - **Eventos:** seleccionar `checkout.session.completed`
- [ ] Copiar el **Signing secret** (whsec_...) y añadirlo en Vercel como `STRIPE_WEBHOOK_SECRET`.
- [ ] Si añadiste la variable después del deploy: **Redeploy** en Vercel para que tome el secret.
- [ ] Probar el webhook:
  - [ ] En Stripe, "Send test webhook" para `checkout.session.completed`, o
  - [ ] Realizar un pago de prueba (modo test) y completar el checkout.
- [ ] Verificar que el endpoint responde **200** (en Stripe o en logs de Vercel).
- [ ] Verificar en **Supabase** que el registro en `payments` y el estado del lead se actualizan correctamente.  
  **Para completar:** Stripe Dashboard → Webhooks → tu endpoint → Send test webhook (evento `checkout.session.completed`) → comprobar respuesta 200. Ver [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md) (Optional checks).

---

## 3. Smoke (pruebas en producción)

- [x] **Health:** *(Verificado por QA Fase 3 para dev URL.)*
  - [x] `GET https://<tu-dominio>/api/health` → **200**
  - [x] `GET https://<tu-dominio>/api/health/ready` → **200**
- [ ] **Flujo completo (una pasada):**  
  **Para completar:** Ir a /assessment, rellenar y enviar → redirect a /thank-you?lead_id=...; login admin, abrir ese lead, Collect deposit, completar Stripe (4242...); ver success_url con ?paid=1; comprobar en Supabase payments (status succeeded, stripe_checkout_session_id) y leads (status deposit_paid). Ver [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md) pasos 1–6.
  - [ ] Completar el formulario de assessment en el sitio público.
  - [ ] Comprobar que se crea el lead (admin o DB).
  - [ ] En admin: abrir el lead y solicitar depósito (Collect deposit).
  - [ ] Completar el checkout de Stripe (modo test si aplica).
  - [ ] Comprobar que el webhook se recibe (200) y que en DB: `payments.status = succeeded`, `leads.status = deposit_paid`.

---

## Cierre

- [ ] Marcar el track **Deploy** como ✅ en [STATUS.md](../STATUS.md) cuando todas las casillas anteriores estén completadas.
- [ ] Documentar la URL de producción y el dominio custom (si aplica) en el equipo.

---

*Sprint: Deploy & production verification — Nebula Smile*
