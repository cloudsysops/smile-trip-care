# Qué hacer ahora — Probar y avanzar

Sigue estos pasos en orden. Cuando termines, marca las casillas y actualiza STATUS.md.

**URL de la app (dev):** https://smile-transformation-platform-dev.vercel.app

---

## Antes de empezar (solo una vez)

- [ ] **Supabase:** Migraciones aplicadas (`0001_init.sql`) y seed de paquetes (`scripts/seed_packages.sql`). Ver README / Run after migration.
- [ ] **Admin:** Tienes al menos un usuario admin. Si no: [PRIMER_ADMIN.md](PRIMER_ADMIN.md) — crear usuario en Supabase Auth y en SQL `UPDATE profiles SET role = 'admin' WHERE id = '<tu-user-uuid>'`.
- [ ] **Vercel:** Las 7 variables de entorno están configuradas (Supabase + Stripe). Ver [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md).
- [ ] **Stripe webhook:** En Stripe Dashboard → Developers → Webhooks tienes un endpoint con URL  
  `https://smile-transformation-platform-dev.vercel.app/api/stripe/webhook`  
  y evento **checkout.session.completed**. El **Signing secret** (whsec_...) está en Vercel como `STRIPE_WEBHOOK_SECRET`. Si lo añadiste después del deploy, haz **Redeploy** en Vercel.

---

## Paso 1 — Probar el webhook (2 min)

1. Entra en **Stripe Dashboard** → **Developers** → **Webhooks**.
2. Abre tu endpoint (el que apunta a `/api/stripe/webhook`).
3. Pulsa **Send test webhook**.
4. Elige el evento **checkout.session.completed** (o el que tengas configurado).
5. Comprueba que la respuesta sea **200**.

- [ ] Webhook responde 200.

---

## Paso 2 — Flujo completo (una venta de prueba)

### 2.1 Crear el lead

1. Abre: https://smile-transformation-platform-dev.vercel.app
2. Clic en **Start Free Assessment** (o View Packages → elegir paquete → Start with this package).
3. Rellena: nombre, apellido, email (obligatorios). Opcional: teléfono, país, paquete, mensaje.
4. Envía el formulario.
5. Debes ir a **Thank you** con algo como `/thank-you?lead_id=...`. Anota el `lead_id` si quieres.

- [ ] Redirect a thank-you con lead_id.

### 2.2 Entrar al admin

1. Ve a **Sign in**: https://smile-transformation-platform-dev.vercel.app/signin  
   (o /admin/login, que redirige ahí).
2. Inicia sesión con tu usuario **admin** (email + contraseña de Supabase).
3. Entra en **Leads** y localiza el lead que acabas de crear.

- [ ] Login admin OK. Lead visible en la lista.

### 2.3 Cobrar el depósito

1. Abre el **detalle del lead** (clic en el lead).
2. En la sección **Stripe deposit**, clic en **Collect deposit**.
3. Indica el importe (o deja el que venga por defecto).
4. Te redirigirá a **Stripe Checkout**.

### 2.4 Pagar con tarjeta de prueba

1. En Stripe Checkout usa la tarjeta de prueba: **4242 4242 4242 4242**.
2. Fecha de caducidad: cualquiera futura (ej. 12/34). CVC: ej. 123.
3. Completa el pago.
4. Debes volver a la app con algo como `/admin/leads/<id>?paid=1` y mensaje de éxito.

- [ ] Pago completado y redirect con ?paid=1.

### 2.5 Verificar en Supabase

1. **Supabase** → tu proyecto → **Table Editor**.
2. **payments:** busca la fila de este lead. Debe tener `stripe_checkout_session_id` (empieza por `cs_`) y `status` = **succeeded**.
3. **leads:** esa fila debe tener `status` = **deposit_paid**.

- [ ] payments.status = succeeded, leads.status = deposit_paid.

---

## Paso 3 — Cerrar checklists y STATUS

- [ ] En [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) marca las casillas que hayas completado (webhook 200, flujo completo, etc.).
- [ ] En [CHECKLIST_PRIMERA_VENTA.md](CHECKLIST_PRIMERA_VENTA.md) marca las casillas correspondientes.
- [ ] En [STATUS.md](../STATUS.md) cambia el track **Deploy** de "🔶 Casi listo" a **✅** y actualiza la definición de done si quieres.

---

## Si algo falla

| Problema | Revisar |
|----------|--------|
| Lead no aparece en admin | POST /api/leads devolvió 201? Revisa pestaña Network. |
| Collect deposit no hace nada | ¿Estás logueado como admin? Revisa consola y Network (POST /api/stripe/checkout). |
| Stripe Checkout falla | Claves en Vercel: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. |
| Webhook no actualiza pago | STRIPE_WEBHOOK_SECRET en Vercel; URL exacta /api/stripe/webhook; Redeploy tras añadir secret. |

Más detalle: [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md).
