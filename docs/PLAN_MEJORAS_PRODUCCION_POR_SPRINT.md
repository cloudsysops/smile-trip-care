# Plan de mejoras para producción — Organizado por sprint (asignable a agentes)

**Objetivo:** Cerrar las mejoras identificadas en la auditoría CTO para dejar la plataforma lista y mantenible en producción.  
**Fuentes:** [CTO_AUDITOR_REVIEW.md](CTO_AUDITOR_REVIEW.md), [CTO_FULL_CURRENT_STATE_AUDIT.md](CTO_FULL_CURRENT_STATE_AUDIT.md), [PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md](PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md).

Cada sprint tiene: **objetivo**, **tareas con criterios de aceptación**, **agente sugerido**, **clasificación (SAFE/MODERATE)** y **archivos implicados**.

---

## Resumen de mejoras (auditoría)

| Área | Mejora | Prioridad | Sprint |
|------|--------|-----------|--------|
| Seguridad | Rate limit en signup y login | Alta | 2 |
| Seguridad | SECURITY.md: contacto real | Alta | 1 |
| Pagos | Persistir eventos webhook en `stripe_webhook_events` | Alta | 3 |
| Auth | Middleware para rutas por rol (/provider, /specialist, etc.) | Media | 2 |
| Docs | Regla: escrituras sensibles solo con guard + server client | Alta | 1 |
| Observabilidad | Sentry (o similar) | Media | 4 |
| UX | Email confirmation: documentar flujo si está activo en Supabase | Baja | 3 |
| QA | E2E smoke (assessment → thank-you) | Media | 4 |
| RLS | Documentar revisión de políticas antes de go-live | Media | 4 |
| UX | Forgot password (opcional) | Baja | 5 |

---

## Sprint 1 — Cierre de lanzamiento y docs de seguridad

**Objetivo:** Cerrar el track Deploy con verificación humana y dejar documentadas las reglas de seguridad y el contacto.

**Clasificación:** SAFE (solo verificación y documentación).

| ID | Tarea | Agente | Criterios de aceptación | Archivos | Hecho |
|----|--------|--------|--------------------------|----------|-------|
| S1.1 | **Humano/DevOps:** Verificar en Stripe Dashboard que el webhook responde 200 (Send test webhook para `checkout.session.completed`). | DevOps/QA | Respuesta 200; `STRIPE_WEBHOOK_SECRET` en Vercel. | — | [ ] |
| S1.2 | **Humano/QA:** Ejecutar flujo completo una vez según [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md): assessment → thank-you → admin (o patient) → Collect deposit → Stripe 4242 → verificar en Supabase payments/leads. | QA | Lead creado, pago succeeded, leads.status = deposit_paid. | — | [ ] |
| S1.3 | Marcar casillas completadas en [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) y, si aplica, [CHECKLIST_PRIMERA_VENTA.md](CHECKLIST_PRIMERA_VENTA.md). Poner **Deploy ✅** en [STATUS.md](../STATUS.md). | Repo/QA | Checklists y STATUS actualizados. | `docs/DEPLOY_CHECKLIST.md`, `STATUS.md` | [ ] |
| S1.4 | Sustituir en [SECURITY.md](../SECURITY.md) el placeholder "indicar email de contacto" por un email real de contacto de seguridad (o instrucción tipo "abrir issue privado / contactar al mantenedor"). | Repo/CI | SECURITY.md sin placeholder; contacto usable. | `SECURITY.md` | [ ] |
| S1.5 | Añadir en [DATA_MODEL.md](DATA_MODEL.md) o [ENGINEERING_HANDBOOK.md](ENGINEERING_HANDBOOK.md) una regla explícita: *"Las tablas sensibles (leads, payments, profiles, etc.) solo deben escribirse desde Route Handlers que usen requireAdmin o comprobación explícita de scope (ej. email del paciente) y getServerSupabase(). No exponer service role al cliente."* | Backend/Repo | Párrafo visible en docs; enlace desde CTO_AUDITOR si aplica. | `docs/DATA_MODEL.md` o `docs/ENGINEERING_HANDBOOK.md` | [ ] |
| S1.6 | Documentar en README o en [PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md](PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md) la URL de producción (y dominio custom si aplica). | Repo/CI | Una línea con la URL final. | `README.md` o `docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md` | [ ] |

**Salida Sprint 1:** Deploy cerrado, SECURITY.md con contacto, regla de escrituras sensibles documentada, URL de producción documentada.

---

## Sprint 2 — Seguridad: rate limit auth y middleware por rol

**Objetivo:** Reducir abuso en signup/login y proteger rutas por rol en middleware (no solo en página).

**Clasificación:** MODERATE (toca auth y rutas protegidas).

| ID | Tarea | Agente | Criterios de aceptación | Archivos | Hecho |
|----|--------|--------|--------------------------|----------|-------|
| S2.1 | Añadir rate limit a **POST /api/signup**: por IP (ej. `signup:${ip}`), misma lógica que en `/api/leads` (usar `checkRateLimit` de `lib/rate-limit`). Ventana ej. 15 min, máx. 5 intentos. Si se excede, devolver 429 con mensaje amigable. | Backend | 429 cuando se supera el límite; tests que mockeen rate limit y verifiquen 429. | `app/api/signup/route.ts`, `lib/rate-limit.ts`, `tests/` | [ ] |
| S2.2 | Añadir rate limit al **login**: si el login se hace contra Supabase desde el cliente, no hay API propia. Opciones: (A) crear **POST /api/auth/login** con rate limit por IP; (B) documentar que el rate limit de signup cubre abuso y dejar login client-side. **Recomendación:** (A) para limitar intentos; (B) como mínimo documentar. | Backend | Si (A): 429; no revelar credenciales. Si (B): párrafo en AUTH_AND_ROLES. | `app/api/auth/login/route.ts` (si A), `docs/AUTH_AND_ROLES.md` | [ ] |
| S2.3 | Extender el middleware para que, además de `/admin*`, redirija a `/login?next=<path>` cuando la ruta sea `/provider`, `/specialist`, `/coordinator` o `/patient` y no haya usuario. | Backend | Usuario no autenticado en esas rutas es redirigido sin ejecutar página. | `lib/supabase/middleware.ts` | [ ] |
| S2.4 | Ejecutar `npm run verify` y añadir/ajustar tests para rate limit signup (y login si aplica). | Backend/QA | Verify en verde; tests de rate limit pasan. | `tests/` | [ ] |

**Salida Sprint 2:** Signup (y opcionalmente login) con rate limit; rutas por rol protegidas también en middleware.

**Nota:** Si se implementa POST /api/auth/login, el formulario de login debe cambiar a llamar a ese endpoint en lugar de Supabase directo desde el cliente; clasificación sigue siendo MODERATE.

---

## Sprint 3 — Pagos: auditoría webhook y documentación email

**Objetivo:** Persistir eventos de Stripe en `stripe_webhook_events` para auditoría y métricas correctas; documentar flujo de confirmación de email.

**Clasificación:** MODERATE (toca flujo del webhook de pagos).

| ID | Tarea | Agente | Criterios de aceptación | Archivos | Hecho |
|----|--------|--------|--------------------------|----------|-------|
| S3.1 | En **POST /api/stripe/webhook**, tras verificar la firma y parsear el evento, insertar (o upsert por `stripe_event_id`) una fila en `stripe_webhook_events`: `stripe_event_id`, `event_type`, `status = 'received'`, `received_at`, opcionalmente `livemode`, `stripe_api_version`. Para `checkout.session.completed` que se procese, actualizar después a `processed` (o `failed` si falla); para eventos ignorados, `ignored`. | Backend | Cada evento registrado; duplicados por event_id no duplican filas; métricas admin correctas. | `app/api/stripe/webhook/route.ts` | [ ] |
| S3.2 | Manejar idempotencia: si el insert por `stripe_event_id` falla por unique violation, tratar como replay y no fallar el webhook (devolver 200). Opcional: actualizar `processed_at` y `status` al terminar. | Backend | Replays no generan 500; estado coherente. | `app/api/stripe/webhook/route.ts` | [ ] |
| S3.3 | Añadir test(s) que verifiquen que, al recibir un evento válido, se inserta fila en `stripe_webhook_events` (mock de Supabase). | Backend | Tests pasan en CI. | `tests/stripe-webhook-api.test.ts` o nuevo | [ ] |
| S3.4 | Documentar en [AUTH_AND_ROLES.md](AUTH_AND_ROLES.md): si Supabase tiene "Confirm email" activado, flujo "Confirmar email → luego iniciar sesión"; POST /api/signup tras confirmar. Nota de troubleshooting si el perfil no se crea. | Repo/Frontend | Párrafo claro para operaciones. | `docs/AUTH_AND_ROLES.md` | [ ] |

**Salida Sprint 3:** Webhook con auditoría en DB; documentación de email confirmation.

---

## Sprint 4 — Observabilidad y calidad

**Objetivo:** Errores en producción visibles; smoke E2E opcional; RLS documentado para go-live.

**Clasificación:** MODERATE (Sentry, E2E) y SAFE (docs).

| ID | Tarea | Agente | Criterios de aceptación | Archivos | Hecho |
|----|--------|--------|--------------------------|----------|-------|
| S4.1 | Integrar **Sentry** (o similar) para captura de errores en servidor (Route Handlers, Server Components). Variables: `SENTRY_DSN`, etc.; no loguear PII. Documentar en README o ENV_Y_STRIPE. | Backend | Errores en API reportados; env documentado. | `lib/`, `app/api/`, `docs/`, `.env.example` | [ ] |
| S4.2 | (Opcional) Añadir **test E2E** (Playwright o similar) para assessment → thank-you con `lead_id`. Ejecutable en CI o local; no bloqueante si costoso. | QA | Script o job documentado. | `e2e/` o `tests/e2e/` | [ ] |
| S4.3 | Documentar **RLS**: revisar políticas en Supabase antes de go-live; no ampliar escritura a leads/payments sin revisión. | Backend/Repo | Checklist o párrafo en DATA_MODEL o RLS_REVIEW. | `docs/DATA_MODEL.md` o `docs/RLS_REVIEW.md` | [ ] |
| S4.4 | Ejecutar `npm run verify` tras cambios. | Cualquiera | Verify en verde. | — | [ ] |

**Salida Sprint 4:** Sentry activo; opcional E2E; doc de revisión RLS para producción.

---

## Sprint 5 — Mejoras opcionales (backlog)

**Objetivo:** Forgot password, dominio custom, staging; no bloquean lanzamiento.

**Clasificación:** SAFE / MODERATE según tarea.

| ID | Tarea | Agente | Criterios de aceptación | Archivos | Hecho |
|----|--------|--------|--------------------------|----------|-------|
| S5.1 | **Forgot password:** En /login enlace "¿Olvidaste tu contraseña?" con reset de Supabase (resetPasswordForEmail). | Frontend | Usuario puede solicitar reset; no revelar datos. | `app/login/page.tsx`, `lib/supabase/browser.ts` o API | [ ] |
| S5.2 | Dominio custom en Vercel cuando se defina la URL final. | DevOps | Proyecto Vercel con dominio configurado. | — | [ ] |
| S5.3 | (Opcional) Entorno staging: Vercel Preview y/o Supabase staging. | DevOps | Documentado o configurado. | `docs/` | [ ] |

---

## Asignación por tipo de agente

| Agente | Sprints y tareas típicas |
|--------|---------------------------|
| **Repo/CI** | S1.3, S1.4, S1.5, S1.6; verificar `npm run verify` tras cambios de otros. |
| **Backend** | S2.1, S2.2, S2.3, S2.4; S3.1, S3.2, S3.3; S4.1, S4.3. |
| **Frontend** | S3.4 (doc); S5.1. |
| **QA** | S1.1, S1.2, S1.3; S2.4; S4.2; ejecutar verify. |
| **DevOps** | S1.1 (webhook); S5.2, S5.3. |

---

## Orden de ejecución recomendado

1. **Sprint 1** — Cierre de lanzamiento y docs (SAFE). Hacer primero para tener Deploy ✅ y reglas claras.
2. **Sprint 2** — Rate limit y middleware (MODERATE). Mejora seguridad antes de tráfico real.
3. **Sprint 3** — Webhook audit y email doc (MODERATE). Mejora trazabilidad de pagos.
4. **Sprint 4** — Sentry, E2E, RLS doc (MODERATE/SAFE). Mejora observabilidad y preparación go-live.
5. **Sprint 5** — Backlog opcional cuando 1–4 estén cerrados o en paralelo sin bloqueos.

---

## Reglas para agentes

- Antes de implementar una tarea **MODERATE**, revisar [CTO_AUDITOR_REVIEW.md](CTO_AUDITOR_REVIEW.md) (guards, validación, scope).
- Después de cada tarea: `npm run verify` debe pasar; marcar la tarea en este doc (por ejemplo `[x]` en una columna Hecho si se añade).
- No cambiar lógica de webhook (firma, amount) ni exponer service role; no relajar honeypot ni rate limit en leads.
- Si una tarea requiere decisión humana (ej. email de seguridad, dominio), dejar instrucción clara o placeholder documentado en lugar de inventar valores.

---

## Resumen de archivos implicados por sprint

| Sprint | Archivos principales |
|--------|----------------------|
| 1 | `SECURITY.md`, `STATUS.md`, `docs/DEPLOY_CHECKLIST.md`, `docs/DATA_MODEL.md` o `docs/ENGINEERING_HANDBOOK.md`, `README.md` |
| 2 | `app/api/signup/route.ts`, `app/api/auth/login/route.ts` (si se crea), `lib/supabase/middleware.ts`, `lib/rate-limit.ts`, `tests/` |
| 3 | `app/api/stripe/webhook/route.ts`, `tests/stripe-webhook-api.test.ts`, `docs/AUTH_AND_ROLES.md` |
| 4 | `lib/` (Sentry), `app/api/`, `docs/`, `e2e/` o `tests/e2e/`, `docs/DATA_MODEL.md` o `docs/RLS_REVIEW.md` |
| 5 | `app/login/page.tsx`, configuración Vercel/Supabase, `docs/` |

---

*Documento vivo: actualizar estado de tareas cuando los agentes las completen. Última actualización: 2026-03-08.*
