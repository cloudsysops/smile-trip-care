# QA Fase 3 — Pasos manuales para el humano

Documentación generada por el Agente QA. Las comprobaciones automáticas (verify, health) ya se ejecutaron; estos pasos deben realizarlos una persona con acceso a Stripe Dashboard, navegador y Supabase.

**Q3.1 — Pre-requisitos (variables Vercel y migraciones Supabase):** El agente no puede comprobar desde aquí que las variables de entorno estén configuradas en Vercel ni que las migraciones y el seed estén aplicados en Supabase. Según [DEPLOY_CHECKLIST](DEPLOY_CHECKLIST.md): (1) En Vercel, revisar que existan todas las variables listadas en §1 (incl. `STRIPE_WEBHOOK_SECRET`). (2) En Supabase, confirmar que las migraciones del proyecto están aplicadas y que el seed de paquetes se ha ejecutado si aplica.

---

## Q3.3 — Probar webhook Stripe (respuesta 200)

1. Abre **Stripe Dashboard** (modo Test): https://dashboard.stripe.com/test/webhooks  
2. Localiza el endpoint configurado para tu app (ej. `https://smile-transformation-platform-dev.vercel.app/api/stripe/webhook`).  
3. Entra en ese endpoint (clic en la URL o en "..." → View details).  
4. Pulsa **"Send test webhook"**.  
5. Elige el evento **`checkout.session.completed`** y envía.  
6. Comprueba que la respuesta del endpoint es **200** (en la lista de eventos recientes o en "Recent deliveries").  
7. Si recibes 4xx/5xx, revisa que `STRIPE_WEBHOOK_SECRET` en Vercel coincida con el *Signing secret* (whsec_...) del endpoint en Stripe y que el deploy esté al día.

---

## Q3.4 y Q3.5 — Flujo completo en el navegador

### (a) Assessment → thank-you

1. Ir a **https://smile-transformation-platform-dev.vercel.app/assessment**.  
2. Rellenar el formulario con datos de prueba (nombre, apellido, email válido, etc.).  
3. Enviar el formulario.  
4. Verificar que hay **redirect** a una URL del tipo **`/thank-you?lead_id=<uuid>`** (el `lead_id` es un UUID).  
5. Comprobar en admin que el lead aparece en la lista (admin → leads).

### (b) Admin: Collect deposit y Stripe Checkout

1. Iniciar sesión en **/admin/login** con un usuario admin.  
2. Abrir el lead recién creado (el de la prueba anterior).  
3. Pulsar **"Collect deposit"** (o equivalente).  
4. Completar el checkout de Stripe con tarjeta de prueba: **4242 4242 4242 4242** (fecha y CVC cualquiera futuros, código postal si lo pide).  
5. Confirmar el pago en Stripe.

### (c) Success URL con ?paid=1

1. Tras completar el pago, Stripe redirige a la **success_url** de la app.  
2. Verificar que la URL incluye **`?paid=1`** (y opcionalmente `session_id=...`).  
3. La pantalla debe mostrar mensaje de éxito y/o el estado del lead actualizado a deposit pagado.

---

## Q3.6 — Comprobar en Supabase

Tras el flujo anterior (assessment → lead → depósito → Stripe):

1. **Tabla `payments`**  
   - Debe existir una fila asociada al lead usado.  
   - `status` = **`succeeded`**.  
   - `stripe_checkout_session_id` debe estar rellenado (valor que empieza por `cs_` en modo test).

2. **Tabla `leads`**  
   - El lead usado debe tener **`status` = `deposit_paid`**.

3. Opcional: en Stripe Dashboard → Developers → Webhooks, el evento `checkout.session.completed` de ese pago debe aparecer como entregado con respuesta **200**.

---

*Fase 3 — Agente QA. Referencia: [PLAN_AGENTES_CIERRE_VENTA](PLAN_AGENTES_CIERRE_VENTA.md).*
