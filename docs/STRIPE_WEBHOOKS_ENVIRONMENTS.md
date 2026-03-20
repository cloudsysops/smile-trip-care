# Stripe webhooks por ambiente

Configuración de endpoints y signing secrets por entorno. **Nunca** subas `STRIPE_WEBHOOK_SECRET` a Git.

---

## Ambientes y URLs

| Ambiente | URL base (ejemplo) | Webhook endpoint |
|----------|--------------------|-------------------|
| **dev** | `https://smile-transformation-platform-dev.vercel.app` | `https://smile-transformation-platform-dev.vercel.app/api/stripe/webhook` |
| **staging** | `https://staging.medvoyage.com` | `https://staging.medvoyage.com/api/stripe/webhook` |
| **prod** | `https://medvoyage.com` | `https://medvoyage.com/api/stripe/webhook` |

Ajusta las URLs según tu dominio real. Dev suele ser el proyecto Vercel de preview (rama `main` o el que tengas configurado).

---

## Eventos importantes

Configura en Stripe Dashboard → Webhooks → Add endpoint → **Events to send**:

| Evento | Uso en Smile |
|--------|----------------|
| **checkout.session.completed** | Principal: actualizar lead a deposit_paid, crear/actualizar payment y booking. **Obligatorio.** |
| **payment_intent.succeeded** | Opcional: auditoría o lógica adicional de pagos. |

El flujo actual de la app se basa en `checkout.session.completed` con `payment_status === 'paid'`. Los demás eventos no se procesan en el webhook actual.

---

## Por ambiente

### Dev

- **Forward URL (Stripe CLI):** `http://127.0.0.1:3000/api/stripe/webhook` para probar en local.
- **Signing secret:** Crear endpoint en Stripe (o usar CLI `stripe listen --forward-to localhost:3000/api/stripe/webhook`) y guardar `whsec_...` en `.env.local` como `STRIPE_WEBHOOK_SECRET`.
- **Vercel dev:** Si usas el deploy de dev (ej. smile-transformation-platform-dev.vercel.app), crea un endpoint en Stripe apuntando a esa URL y guarda el secret en Vercel (Environment Variables) para ese proyecto.

### Staging

- **URL:** `https://staging.medvoyage.com/api/stripe/webhook` (o la URL de tu staging).
- **Secret:** Stripe Dashboard → Webhooks → Add endpoint (modo Test o Live según corresponda) → copiar Signing secret → Vercel (o tu plataforma) → variables de entorno de **staging**.

### Prod

- **URL:** `https://medvoyage.com/api/stripe/webhook` (o tu dominio de producción).
- **Secret:** Mismo flujo; guardar en Vercel como variable de **Production**. No reutilizar el secret de dev/staging.

---

## Verificación

- **Dev / staging / prod:** En Stripe → Webhooks → tu endpoint → **Send test webhook** (evento `checkout.session.completed`) → comprobar respuesta **200**.
- Ver [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md) y [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md).
