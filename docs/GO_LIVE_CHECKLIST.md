# Go-live checklist — MedVoyage Smile

Checklist operativo para dar el pase a producción. Completar en orden cuando corresponda. Detalle de deploy en [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md).

---

## 1. Stripe y pagos

- [ ] **Stripe webhook returns 200**  
  Stripe Dashboard → Webhooks → tu endpoint → Send test webhook (`checkout.session.completed`) → respuesta 200.
- [ ] **First test payment success**  
  Flujo completo: assessment → thank-you → (signin si aplica) → admin o patient → Collect deposit → tarjeta 4242… → checkout completado.
- [ ] **Admin sees deposit_paid**  
  En Supabase (o en admin lead detail) el lead pasa a estado `deposit_paid` y el pago aparece en `payments`.

---

## 2. Observabilidad y configuración

- [ ] **Sentry configured**  
  Variable `SENTRY_DSN` en Vercel (y opcionalmente en local); errores de servidor reportados. *(Opcional pero recomendado antes de tráfico real.)*
- [ ] **Environment variables validated**  
  `./scripts/env_check.sh` pasa con las variables necesarias; en Vercel no falte ninguna obligatoria (ver [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md)).

---

## 3. Seguridad y documentación

- [ ] **SECURITY.md**  
  Sustituir el placeholder de contacto (email o instrucción de reporte) por un valor real. Ver [SECURITY.md](../SECURITY.md).

---

## 4. Cierre

- [ ] Marcar lo completado en [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) y, si aplica, en [CHECKLIST_PRIMERA_VENTA.md](CHECKLIST_PRIMERA_VENTA.md).
- [ ] En [STATUS.md](../STATUS.md): poner **Deploy ✅** en el track correspondiente.

---

**Referencias:** [STRIPE_WEBHOOKS_ENVIRONMENTS.md](STRIPE_WEBHOOKS_ENVIRONMENTS.md), [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md), [ARCHITECTURE.md](ARCHITECTURE.md).
