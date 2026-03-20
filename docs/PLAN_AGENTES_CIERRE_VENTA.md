# Plan de trabajo — Agentes: frontend, backend y cierre de venta

Objetivo: que los agentes mejoren frontend y backend, y que se **cierre una venta completa** (assessment → lead → depósito → Stripe → webhook → DB) para verificar que todos los flujos funcionan.

**Contexto:** Nebula Smile. Next.js 16, Supabase, Stripe, Vercel. Rama de trabajo: la que uses (ej. `production-hardening`). Deploy dev: `https://smile-transformation-platform-dev.vercel.app`.

---

## Resumen por fases

| Fase | Responsable | Objetivo |
|------|-------------|----------|
| **Fase 1** | Agente Frontend | Mejorar UX y claridad en landing, assessment, thank-you, admin (leads + depósito). |
| **Fase 2** | Agente Backend | Revisar y endurecer APIs (leads, Stripe checkout/webhook), mensajes de error y logs. |
| **Fase 3** | Agente QA / Verificación | Ejecutar flujo completo, probar webhook, validar DB y marcar checklists. |

Cada fase puede ser ejecutada por un agente en una sesión; al final de Fase 3 debe quedar **una venta de prueba cerrada** y documentada.

---

## Fase 1 — Frontend (Agente Frontend)

**Objetivo:** Mejorar la experiencia de usuario en el flujo de captación (landing → assessment → thank-you) y en el admin (leads y cobro de depósito), sin romper funcionalidad.

### Tareas

| ID | Tarea | Criterios de aceptación | Archivos / zona |
|----|--------|-------------------------|------------------|
| F1.1 | **Landing:** Revisar CTAs, textos y enlaces hacia assessment y paquetes. Asegurar que "Get started" / "Assessment" llevan a `/assessment` o `/assessment?package=slug`. | CTAs visibles y correctos; enlaces funcionan. | `app/page.tsx`, componentes de la landing |
| F1.2 | **Assessment:** Mensajes de error visibles y claros (ej. "Please check your email" si falla validación). Loading state en el botón de envío (disabled + "Sending..."). | No envíos dobles; usuario entiende éxito o error. | `app/assessment/AssessmentForm.tsx` |
| F1.3 | **Thank-you:** Página muestra el `lead_id` como referencia; mensaje claro de "We'll be in touch". Enlace a home y opcional a paquetes. | Coherente con [CHECKLIST_PRIMERA_VENTA](CHECKLIST_PRIMERA_VENTA.md). | `app/thank-you/page.tsx` |
| F1.4 | **Admin – Lista de leads:** Tabla o lista legible (nombre, email, estado, fecha). Enlace claro al detalle del lead. | Fácil encontrar un lead recién creado. | `app/admin/leads/*` |
| F1.5 | **Admin – Detalle lead:** Botón "Collect deposit" (o equivalente) visible y con estado de carga; tras crear sesión Stripe, redirigir a Stripe Checkout o abrir enlace. Mostrar feedback si ya hay pago (estado deposit_paid). | Un clic lleva al pago; no se pierde el contexto. | `app/admin/leads/[id]`, `DepositButton.tsx` |
| F1.6 | **Admin – Post-pago:** Tras volver de Stripe (success_url con `?paid=1`), mostrar mensaje de éxito y/o actualizar estado del lead en pantalla sin recargar a mano. | Usuario ve que el depósito se registró. | `app/admin/leads/[id]` (lectura de `paid=1`) |

**Salida Fase 1:** Frontend estable; `npm run verify` pasa; flujo assessment → thank-you y admin → deposit son usables de punta a punta.

**Referencias:** [CHECKLIST_PRIMERA_VENTA](CHECKLIST_PRIMERA_VENTA.md), [TEST_STEPS](TEST_STEPS.md).

---

## Fase 2 — Backend (Agente Backend)

**Objetivo:** Revisar APIs críticas del flujo de venta (leads, Stripe checkout, webhook), mejorar manejo de errores y asegurar que los contratos (body, respuesta) son claros.

### Tareas

| ID | Tarea | Criterios de aceptación | Archivos / zona |
|----|--------|-------------------------|------------------|
| B2.1 | **POST /api/leads:** Respuesta siempre incluye `lead_id` (UUID) en éxito (201). Mensajes de error claros (honeypot, validación, rate limit) sin filtrar datos sensibles. | Cliente puede usar `lead_id` para redirect a thank-you. | `app/api/leads/route.ts` |
| B2.2 | **POST /api/stripe/checkout:** Solo admin; body validado (lead_id, amount_cents). Si el lead no existe o ya tiene depósito pagado, devolver 400 con mensaje claro. Inserción en `payments` con status `pending`. | No se crean sesiones para leads inválidos. | `app/api/stripe/checkout/route.ts` |
| B2.3 | **POST /api/stripe/webhook:** Ya usa raw body y firma. Asegurar que en todos los caminos de salida se devuelve 200 cuando el evento fue "recibido" (incluso si no se procesa por metadata inválida), para que Stripe no reintente en vano. Logs mínimos (sin datos de tarjeta). | Stripe no marca el webhook como fallido por 4xx/5xx en casos ya manejados. | `app/api/stripe/webhook/route.ts` |
| B2.4 | **Health/Ready:** Sin cambios funcionales; solo confirmar que `/api/health` y `/api/health/ready` siguen respondiendo 200 en deploy. | Scripts `deploy_verify` y `verify_production` siguen pasando. | `app/api/health/*`, `app/api/health/ready/*` |
| B2.5 | **Tests:** Al menos un test que cubra: lead creado devuelve `lead_id`; (opcional) checkout requiere auth admin. Ejecutar `npm run test` y que pase. | CI/verify estable. | `**/*.test.ts` o `**/*.spec.ts` |

**Salida Fase 2:** APIs alineadas con el flujo de venta; errores claros; webhook idempotente y estable; tests pasando.

**Referencias:** [ENV_Y_STRIPE](ENV_Y_STRIPE.md), [DEPLOY_CHECKLIST](DEPLOY_CHECKLIST.md) §2.

---

## Fase 3 — Verificación y cierre de venta (Agente QA / Verificación)

**Objetivo:** Ejecutar **una venta completa de punta a punta** en el entorno dev y marcar los checklists para dar por verificado el flujo.

### Tareas

| ID | Tarea | Criterios de aceptación | Ref |
|----|--------|-------------------------|-----|
| Q3.1 | **Pre-requisitos** | Código al día; `npm run verify` OK; variables de entorno en Vercel (incl. `STRIPE_WEBHOOK_SECRET`); migraciones y seed aplicados en Supabase. | DEPLOY_CHECKLIST Pre |
| Q3.2 | **Health en producción** | `GET https://smile-transformation-platform-dev.vercel.app/api/health` → 200; `.../api/health/ready` → 200. | DEPLOY_CHECKLIST §3 |
| Q3.3 | **Webhook Stripe** | En Stripe Dashboard → tu endpoint → "Send test webhook" (evento `checkout.session.completed`). Respuesta 200. | DEPLOY_CHECKLIST §2 |
| Q3.4 | **Flujo completo – Assessment** | Completar formulario en `/assessment` con datos de prueba. Enviar. Verificar redirect a `/thank-you?lead_id=...` y que el lead aparece en admin. | CHECKLIST_PRIMERA_VENTA §3 |
| Q3.5 | **Flujo completo – Depósito** | En admin, abrir el lead recién creado. Clic en "Collect deposit". Completar checkout en Stripe (tarjeta test 4242 4242 4242 4242). Volver a la app (success_url). | CHECKLIST_PRIMERA_VENTA §4 |
| Q3.6 | **Flujo completo – DB** | En Stripe: evento del webhook con respuesta 200. En Supabase: en `payments` una fila con `stripe_checkout_session_id` del checkout y `status = 'succeeded'`; en `leads` el lead con `status = 'deposit_paid'`. | DEPLOY_CHECKLIST §3, CHECKLIST_PRIMERA_VENTA §5 |
| Q3.7 | **Cierre** | Marcar en [DEPLOY_CHECKLIST](DEPLOY_CHECKLIST.md) las casillas completadas. Marcar en [CHECKLIST_PRIMERA_VENTA](CHECKLIST_PRIMERA_VENTA.md) las casillas completadas. Opcional: actualizar [STATUS](STATUS.md) track Deploy a ✅. | DEPLOY_CHECKLIST Cierre |

**Salida Fase 3:** Una venta de prueba cerrada; webhook verificado; DB coherente; checklists actualizados.

**Referencias:** [DEPLOY_CHECKLIST](DEPLOY_CHECKLIST.md), [CHECKLIST_PRIMERA_VENTA](CHECKLIST_PRIMERA_VENTA.md), [STATUS](../STATUS.md).

---

## Orden de ejecución recomendado

1. **Fase 1 (Frontend)** → luego **Fase 2 (Backend)**. Pueden ser dos agentes en paralelo si uno solo toca UI y otro solo APIs.
2. **Fase 3 (Verificación)** después de que Fase 1 y 2 estén hechas (o al menos sin errores bloqueantes en verify).

Si el deploy y las variables ya están listos, un solo agente puede hacer Fase 3 primero (venta de prueba) para validar el estado actual, y luego otro agente hace Fase 1 y 2 para mejorar.

---

## Briefings por agente (copiar y pegar)

### Agente Frontend

```
Eres el Agente Frontend del proyecto Nebula Smile. Objetivo: mejorar UX del flujo de venta (landing → assessment → thank-you) y del admin (leads, depósito).

Tareas: docs/PLAN_AGENTES_CIERRE_VENTA.md — Fase 1 (F1.1 a F1.6). Criterios de aceptación en la tabla. Al terminar, ejecutar `npm run verify` y asegurar que pasa. No cambiar contratos de APIs (ej. POST /api/leads debe seguir devolviendo lead_id). Stack: Next.js 16, React 19, TypeScript, Tailwind. Reglas: .cursor/rules si existen.
```

### Agente Backend

```
Eres el Agente Backend del proyecto Nebula Smile. Objetivo: revisar y endurecer las APIs del flujo de venta (leads, Stripe checkout, webhook).

Tareas: docs/PLAN_AGENTES_CIERRE_VENTA.md — Fase 2 (B2.1 a B2.5). Criterios de aceptación en la tabla. Al terminar, ejecutar `npm run verify` y `npm run test`; ambos deben pasar. No romper la firma del webhook (raw body + STRIPE_WEBHOOK_SECRET). Stack: Next.js 16 App Router, Supabase, Stripe. Reglas: .cursor/rules si existen.
```

### Agente QA / Verificación

```
Eres el Agente QA del proyecto Nebula Smile. Objetivo: ejecutar una venta completa de prueba y verificar que todos los flujos funcionan.

Tareas: docs/PLAN_AGENTES_CIERRE_VENTA.md — Fase 3 (Q3.1 a Q3.7). Orden: pre-requisitos → health → webhook test → flujo assessment → depósito en admin → Stripe checkout → comprobar DB (payments + leads). Marcar checklists en DEPLOY_CHECKLIST.md y CHECKLIST_PRIMERA_VENTA.md; opcional STATUS.md. URL dev: https://smile-transformation-platform-dev.vercel.app. Stripe modo Test; tarjeta test 4242 4242 4242 4242.
```

---

## Referencias rápidas

- [CHECKLIST_PRIMERA_VENTA](CHECKLIST_PRIMERA_VENTA.md)
- [DEPLOY_CHECKLIST](DEPLOY_CHECKLIST.md)
- [ENV_Y_STRIPE](ENV_Y_STRIPE.md)
- [STATUS](../STATUS.md)
- [AUDITORIA_RECIENTE](AUDITORIA_RECIENTE.md)
