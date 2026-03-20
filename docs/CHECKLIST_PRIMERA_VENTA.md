# Checklist: primera venta en producción

Pasos para que el equipo realice la primera venta real (o de prueba) en producción.

---

## 1. App desplegada y smoke test

- [ ] La aplicación está desplegada en el entorno de producción (ej. Vercel). Para completar: confirmar en navegador que la URL (ej. smile-transformation-platform-dev.vercel.app) carga. Ver [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md) (Prerequisites).
- [x] El smoke test ha pasado (scripts o comprobaciones manuales definidas para el deploy). *(Verificado por QA Fase 3: npm run verify OK; GET /api/health y /api/health/ready → 200.)*

---

## 2. Primer admin operativo

- [ ] Existe al menos un usuario admin (ver [PRIMER_ADMIN.md](./PRIMER_ADMIN.md)).
- [ ] El admin puede iniciar sesión en `/admin/login` y acceder al panel sin recibir 403.

---

## 3. Crear un lead

- [ ] **Opción A:** Un cliente completa el assessment en la web y se crea el lead desde el formulario. Para completar: ir a /assessment, rellenar formulario, enviar; verificar redirect a /thank-you?lead_id=... y que el lead aparece en admin. Ver [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md) pasos 1–2.
- [ ] **Opción B:** Se crea un lead de prueba manualmente en admin o en Supabase (para test de primera venta).

---

## 4. Flujo de pago en admin

- [ ] En el panel admin, se abre el lead correspondiente. Para completar: login admin, abrir el lead creado en §3, "Collect deposit", completar Stripe con 4242 4242 4242 4242; ver success_url con ?paid=1. Ver [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md) pasos 3–4.
- [ ] Se solicita el depósito (se genera/envía enlace de pago con Stripe).
- [ ] El cliente (o el equipo en modo test) completa el checkout en Stripe.

---

## 5. Verificar webhook y datos

- [ ] Se confirma que Stripe envió el webhook: en **Stripe Dashboard → Developers → Webhooks** (eventos recibidos) o en los logs del proyecto. Para completar: Send test webhook (checkout.session.completed) → respuesta 200. Ver [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md) (Optional checks).
- [ ] En Supabase se comprueba que el pago quedó registrado y que el estado del lead se actualizó según la lógica de negocio (ej. deposit_paid o similar). Para completar: en `payments`: status = succeeded, stripe_checkout_session_id rellenado; en `leads`: status = deposit_paid. Ver [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md) paso 5.

---

## 6. Seguimiento (opcional)

- [ ] Se envía el seguimiento acordado al cliente (email, mensaje, etc.).

---

*Una vez completado este checklist, el flujo de primera venta en producción queda validado.*
