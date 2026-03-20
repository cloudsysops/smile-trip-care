# Plan de trabajo — Salir a producción

Plan ejecutable con tareas asignadas por agente. Completar en orden de fases; las dependencias están indicadas.

---

## Agentes y responsabilidades

| Agente | Responsabilidad | Entregables |
|--------|-----------------|-------------|
| **Agente Repo/CI** | Código listo, rama `main` estable, CI verde | Merge a main, `npm run verify` OK |
| **Agente Supabase** | Base de datos de producción | Proyecto prod, migraciones, seed, usuario admin |
| **Agente Vercel** | Hosting y variables de entorno | Proyecto conectado, env configuradas, deploy OK |
| **Agente Stripe** | Pagos y webhook en prod | Webhook creado, secret en Vercel, prueba 200 |
| **Agente QA** | Verificación en producción | Smoke ejecutado, STATUS y docs actualizados |

---

## Fase 0 — Pre-requisitos (Agente Repo/CI)

| ID | Tarea | Criterios de aceptación | Ref |
|----|--------|-------------------------|-----|
| P0.1 | Código actualizado desde `main` (o rama de deploy acordada) | Branch al día con main o ser main | DEPLOY_CHECKLIST Pre |
| P0.2 | Ejecutar `npm run verify` (lint → test → build) | Exit 0, sin errores | DEPLOY_CHECKLIST Pre |
| P0.3 | Confirmar que migraciones están en el repo | `supabase/migrations/0001_init.sql` … `0004_*` presentes | — |

**Salida:** Repo listo para deploy; CI en verde.

---

## Fase 1 — Supabase producción (Agente Supabase)

| ID | Tarea | Criterios de aceptación | Ref |
|----|--------|-------------------------|-----|
| S1.1 | Crear proyecto Supabase de **producción** | Proyecto en dashboard, región elegida | PRODUCCIÓN_CHECKLIST |
| S1.2 | Aplicar migraciones en orden | Ejecutar en SQL Editor: `0001_init.sql` → `0002_*` → `0003_*` → `0004_*` | STATUS Run after migration |
| S1.3 | Ejecutar seed de paquetes | `scripts/seed_packages.sql`; tabla `packages` con filas esperadas | STATUS Run after migration |
| S1.4 | Crear al menos un usuario admin | En Auth: usuario creado; en `profiles` mismo `id` y `role = 'admin'` | PRODUCCIÓN_CHECKLIST |
| S1.5 | Anotar URL y anon/service_role keys | Para configurar en Vercel (Fase 2) | — |

**Salida:** Supabase prod operativo; credenciales listas para Vercel.

---

## Fase 2 — Vercel y variables (Agente Vercel)

| ID | Tarea | Criterios de aceptación | Ref |
|----|--------|-------------------------|-----|
| V2.1 | Conectar repositorio a Vercel | Import desde GitHub; proyecto creado | VERCEL_DEPLOY §1–3 |
| V2.2 | Configurar variables de entorno (Production) | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY | DEPLOY_CHECKLIST §1 |
| V2.3 | Añadir variables Stripe (sin webhook secret aún) | STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | DEPLOY_CHECKLIST §1 |
| V2.4 | Añadir OPENAI_API_KEY / OPENAI_MODEL si se usan AI en prod | Variables configuradas en Production | DEPLOY_CHECKLIST §1 |
| V2.5 | Primer deploy desde `main` | Build sin errores en Vercel | DEPLOY_CHECKLIST §1 |
| V2.6 | Confirmar que el sitio carga en la URL de producción | Página principal responde | DEPLOY_CHECKLIST §1 |

**Salida:** App desplegada; URL de producción conocida (para Fase 3 y 4).

**Dependencia:** Fase 1 (credenciales Supabase).

---

## Fase 3 — Stripe webhook (Agente Stripe)

| ID | Tarea | Criterios de aceptación | Ref |
|----|--------|-------------------------|-----|
| ST3.1 | En Stripe Dashboard → Webhooks → Add endpoint | URL: `https://<dominio-prod>/api/stripe/webhook` | DEPLOY_CHECKLIST §2 |
| ST3.2 | Seleccionar evento `checkout.session.completed` | Evento añadido al endpoint | DEPLOY_CHECKLIST §2 |
| ST3.3 | Copiar Signing secret (whsec_...) | Secret anotado | — |
| ST3.4 | Añadir en Vercel variable `STRIPE_WEBHOOK_SECRET` (Production) | Variable guardada | DEPLOY_CHECKLIST §2 |
| ST3.5 | Redeploy en Vercel si la variable se añadió después del deploy | Nuevo deploy completado | DEPLOY_CHECKLIST §2 |
| ST3.6 | Probar webhook: "Send test webhook" o pago de prueba | Respuesta 200 en Stripe o en logs Vercel | DEPLOY_CHECKLIST §2 |
| ST3.7 | Verificar en Supabase: `payments.status = succeeded`, lead actualizado a `deposit_paid` | DB coherente con el evento | DEPLOY_CHECKLIST §2 |

**Salida:** Webhook operativo en prod; pagos actualizan correctamente la base de datos.

**Dependencia:** Fase 2 (URL de producción).

---

## Fase 4 — Smoke y QA (Agente QA)

| ID | Tarea | Criterios de aceptación | Ref |
|----|--------|-------------------------|-----|
| Q4.1 | Health: `GET https://<dominio>/api/health` → 200 | JSON con `ok: true` | DEPLOY_CHECKLIST §3 |
| Q4.2 | Ready: `GET https://<dominio>/api/health/ready` → 200 | JSON con `ready: true` y checks ok | DEPLOY_CHECKLIST §3 |
| Q4.3 | Flujo completo: assessment → lead creado | Formulario enviado; lead visible en admin o DB | DEPLOY_CHECKLIST §3 |
| Q4.4 | Flujo: admin → Collect deposit → Checkout Stripe → pago completado | Checkout termina; webhook 200 | DEPLOY_CHECKLIST §3 |
| Q4.5 | Verificar en DB: `payments.status = succeeded`, `leads.status = deposit_paid` | Coherente con el flujo | DEPLOY_CHECKLIST §3 |
| Q4.6 | Login admin en la URL de producción | Acceso a /admin/leads y /admin/assets | PRODUCCIÓN_CHECKLIST |

**Salida:** Smoke completo pasado; producción verificada.

**Dependencia:** Fases 2 y 3.

---

## Fase 5 — Cierre (Agente QA o Repo/CI)

| ID | Tarea | Criterios de aceptación | Ref |
|----|--------|-------------------------|-----|
| C5.1 | Marcar track **Deploy** como ✅ en STATUS.md | Estado actualizado en [STATUS.md](../STATUS.md) | DEPLOY_CHECKLIST Cierre |
| C5.2 | Documentar URL de producción y dominio custom (si aplica) | Anotado en README o doc de equipo | DEPLOY_CHECKLIST Cierre |
| C5.3 | (Opcional) Configurar dominio custom en Vercel | Dominio activo y SSL | PRODUCCIÓN_CHECKLIST |

**Salida:** Proyecto cerrado como "en producción"; documentación al día.

---

## Resumen por agente

Cada agente puede usar esta lista como checklist:

- **Agente Repo/CI:** P0.1, P0.2, P0.3, C5.1 (y C5.2 si aplica).
- **Agente Supabase:** S1.1, S1.2, S1.3, S1.4, S1.5.
- **Agente Vercel:** V2.1, V2.2, V2.3, V2.4, V2.5, V2.6.
- **Agente Stripe:** ST3.1, ST3.2, ST3.3, ST3.4, ST3.5, ST3.6, ST3.7.
- **Agente QA:** Q4.1, Q4.2, Q4.3, Q4.4, Q4.5, Q4.6, C5.1, C5.2, C5.3.

---

## Orden sugerido de ejecución

1. **En paralelo (si hay dos personas/agentes):** Fase 0 (Repo/CI) y Fase 1 (Supabase).
2. **Cuando Fase 1 termine:** Fase 2 (Vercel), usando las credenciales de Supabase.
3. **Cuando Fase 2 tenga URL de prod:** Fase 3 (Stripe webhook).
4. **Cuando Fase 3 termine:** Fase 4 (Smoke) y Fase 5 (Cierre).

---

## Referencias rápidas

- [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) — Checklist oficial deploy.
- [PRODUCCIÓN_CHECKLIST.md](PRODUCCIÓN_CHECKLIST.md) — Checklist ampliado para vender.
- [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) — Pasos detallados Vercel.
- [MEJORAS.md](MEJORAS.md) — Mejoras antes/después de lanzar.
