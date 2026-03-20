# Plan de trabajo — Agentes: producción y mejoras continuas

**Objetivo:** Dejar la plataforma lista para salir a producción y vender, y mantener un backlog de mejoras para que los agentes sigan trabajando de forma automatizada. La plataforma debe estar siempre en mejora.

**Coordinación:** Este documento es la fuente de verdad. Cualquier agente que trabaje en el repo debe consultarlo y actualizar el estado de sus tareas. No parar de trabajar: si una fase está completa, pasar a la siguiente o al backlog.

**Stack:** Next.js 16, React 19, TypeScript, Tailwind, Supabase, Stripe, Vercel.  
**Repo:** smile-transformation-platform. Rama típica: `production-hardening` o `main`.  
**URL dev:** https://smile-transformation-platform-dev.vercel.app

---

## Resumen por fases

Última ejecución agentes: 8 mar 2026 — verify OK. Admin Overview en `/admin/overview`. Migraciones 0006–0009 (marketplace, red curada). Auditoría buenas prácticas: [AUDITORIA_RESULTADO](AUDITORIA_RESULTADO.md).

| Fase | Objetivo | Estado |
|------|----------|--------|
| **0. Pre-producción** | Verificar código, env, migraciones, scripts. | En curso |
| **1. Lanzamiento** | Primera venta verificada, checklists cerrados, Deploy ✅. | Pendiente |
| **2. Mejoras continuas** | Backlog de mejoras (UX, observabilidad, seguridad, docs). | Siempre activo |

---

## Fase 0 — Pre-producción (listos para desplegar)

Completar antes de considerar "production ready". Cualquier agente puede ejecutar y marcar.

| ID | Tarea | Agente | Criterios de aceptación | Ref |
|----|--------|--------|-------------------------|-----|
| P0.1 | Ejecutar `npm run verify` (lint + test + build). Corregir cualquier fallo. | Repo/CI | Exit 0. Sin errores. | DEPLOY_CHECKLIST Pre |
| P0.2 | Confirmar que en Vercel están todas las variables: SUPABASE_*, STRIPE_*, NEXT_PUBLIC_*. | DevOps/Vercel | Lista en [ENV_Y_STRIPE](ENV_Y_STRIPE.md). | DEPLOY_CHECKLIST §1 |
| P0.3 | Confirmar que migraciones Supabase (0001–0009: init, assets, AI, payments, specialists/experiences, marketplace 0007–0008, curated network 0009) y seed (`scripts/seed_medical_tourism.sql`) están aplicados en el proyecto de producción. | DevOps/Supabase | `npm run db:migrate` con proyecto enlazado, o aplicar en SQL Editor en orden. Ver [STATUS](../STATUS.md) § Run after migration. | DEPLOY_CHECKLIST Pre |
| P0.4 | Confirmar que existe al menos un usuario admin (Auth + profiles.role = 'admin'). | DevOps/Supabase | Ver [PRIMER_ADMIN](PRIMER_ADMIN.md). | CHECKLIST_PRIMERA_VENTA §2 |
| P0.5 | Webhook Stripe en Dashboard con URL `https://<dominio>/api/stripe/webhook`, evento `checkout.session.completed`. Variable `STRIPE_WEBHOOK_SECRET` en Vercel. Redeploy si se añadió después. | DevOps/Stripe | "Send test webhook" → respuesta 200. | DEPLOY_CHECKLIST §2 |

**Salida Fase 0:** Código verde, env y webhook configurados, DB lista, admin existe.

---

## Fase 1 — Lanzamiento (primera venta y cierre)

| ID | Tarea | Agente | Criterios de aceptación | Ref |
|----|--------|--------|-------------------------|-----|
| L1.1 | Ejecutar flujo completo una vez: assessment → thank-you → admin → Collect deposit → Stripe (4242...) → success_url ?paid=1. | QA | Lead creado, pago completado, redirect OK. | [TEST_FIRST_SALE](TEST_FIRST_SALE.md) |
| L1.2 | Verificar en Supabase: `payments.status = succeeded`, `leads.status = deposit_paid` para ese lead. | QA | Coherente con el flujo. | DEPLOY_CHECKLIST §3 |
| L1.3 | Marcar casillas completadas en [DEPLOY_CHECKLIST](DEPLOY_CHECKLIST.md) y [CHECKLIST_PRIMERA_VENTA](CHECKLIST_PRIMERA_VENTA.md). | QA | Checklists actualizados. | DEPLOY_CHECKLIST Cierre |
| L1.4 | Marcar track **Deploy** como ✅ en [STATUS](../STATUS.md). | Repo/CI | STATUS.md actualizado. | DEPLOY_CHECKLIST Cierre |
| L1.5 | Documentar URL de producción (y dominio custom si aplica) en README o en este doc. | Repo/CI | Una línea con la URL final. | DEPLOY_CHECKLIST Cierre |

**Salida Fase 1:** Primera venta verificada, Deploy cerrado, documentación al día.

---

## Fase 2 — Mejoras continuas (backlog para agentes)

Los agentes deben seguir trabajando en este backlog cuando no haya tareas bloqueantes de Fase 0 o 1. Prioridad: alta → media → baja.

### Alta prioridad

| ID | Tarea | Agente | Descripción |
|----|--------|--------|-------------|
| M1 | Configurar `NEXT_PUBLIC_WHATSAPP_NUMBER` en Vercel (y en .env.example como opcional). | DevOps | Número real para el botón WhatsApp. |
| M2 | Añadir Sentry (o similar) para errores en producción. | Backend | Captura de errores en APIs y cliente. |
| M3 | Revisar políticas RLS en Supabase de producción antes de go-live real. | Backend/Supabase | Documentar o ajustar si hace falta. |

### Prioridad media

| ID | Tarea | Agente | Descripción |
|----|--------|--------|-------------|
| M4 | Dominio custom en Vercel cuando se decida la URL final. | DevOps | Configurar en proyecto Vercel. |
| M5 | Mejorar mensaje de error en /signin (ej. "Invalid email or password" sin revelar cuál falló). | Frontend | UX y seguridad. |
| M6 | Añadir meta tags y Open Graph para compartir (landing, packages). | Frontend | SEO y preview en redes. |
| M7 | Tests E2E (Playwright o similar) para flujo assessment → thank-you. | QA | Automatizar smoke. |
| M8 | Documentar en README la URL de producción y el flujo "cómo vender". | Repo/CI | Una sección corta. |

### Prioridad baja

| ID | Tarea | Agente | Descripción |
|----|--------|--------|-------------|
| M9 | Migrar middleware a convención "proxy" cuando Next.js lo recomiende estable. | Backend | Eliminar warning de build. |
| M10 | Staging/QA: proyecto Vercel Preview o Supabase staging para probar antes de prod. | DevOps | Opcional. |
| M11 | "Forgot password" en /signin (Supabase reset). | Frontend | Si se requiere. |

---

## Asignación por tipo de agente

Cada agente debe buscar en la tabla anterior las tareas con su nombre y ejecutarlas en orden de fase (0 → 1 → 2). Si no hay tareas asignadas a su tipo, puede tomar cualquier tarea de Fase 0 o 1, o una de Fase 2 por prioridad.

| Agente | Tareas típicas |
|--------|-----------------|
| **Agente Repo/CI** | P0.1, L1.4, L1.5, M8. Verificar que `npm run verify` pasa tras cambios de otros. |
| **Agente Frontend** | Mejoras de landing, assessment, thank-you, signin, admin UI. M5, M6. |
| **Agente Backend** | APIs, webhook, health, tests. M2, M3, M9. |
| **Agente QA** | P0.x (verificación), L1.1–L1.3, M7. Flujo completo y checklists. |
| **Agente DevOps** | P0.2, P0.3, P0.4, P0.5, M1, M4, M10. Vercel, Supabase, Stripe. |

---

## Briefings para pegar en un agente

### Agente Repo/CI

```
Eres el Agente Repo/CI de Nebula Smile. Objetivo: dejar el código y la documentación listos para producción.

Tareas (en orden): docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md — Fase 0 (P0.1), Fase 1 (L1.4, L1.5), Fase 2 (M8).
Ejecuta npm run verify y corrige cualquier fallo. Actualiza STATUS.md cuando el track Deploy esté cerrado. Documenta la URL de producción en README o en el plan.
No introduzcas nuevos frameworks. Stack: Next.js 16, TypeScript, Supabase, Stripe, Vercel.
```

### Agente Frontend

```
Eres el Agente Frontend de Nebula Smile. Objetivo: mejorar UX y conversión sin romper funcionalidad.

Tareas: docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md — Fase 2 mejoras (M5, M6, etc.). Mantén el diseño dark premium. No cambies contratos de APIs.
Ejecuta npm run verify al terminar. Referencias: PLAN_AGENTES_CIERRE_VENTA (Fase 1), TEST_FIRST_SALE.
```

### Agente Backend

```
Eres el Agente Backend de Nebula Smile. Objetivo: APIs estables, webhook idempotente, observabilidad.

Tareas: docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md — Fase 0 (verificar APIs), Fase 2 (M2, M3, M9). Asegura que POST /api/leads devuelve lead_id, que el webhook devuelve 200 en todos los caminos, y que los tests pasan.
No expongas datos sensibles en logs. Ejecuta npm run test y npm run verify.
```

### Agente QA

```
Eres el Agente QA de Nebula Smile. Objetivo: verificar flujo de venta y cerrar checklists.

Tareas: docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md — Fase 0 (P0.1 si hace falta), Fase 1 (L1.1–L1.3). Sigue docs/TEST_FIRST_SALE.md para el flujo completo. Marca DEPLOY_CHECKLIST y CHECKLIST_PRIMERA_VENTA. Opcional: L1.4 (STATUS.md).
URL dev: https://smile-transformation-platform-dev.vercel.app. Stripe test card: 4242 4242 4242 4242.
```

### Agente DevOps

```
Eres el Agente DevOps de Nebula Smile. Objetivo: Vercel, Supabase, Stripe y env listos para producción.

Tareas: docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md — Fase 0 (P0.2, P0.3, P0.4, P0.5), Fase 2 (M1, M4, M10). Verifica variables en Vercel, webhook en Stripe (Send test → 200), migraciones y seed en Supabase, usuario admin. Documenta en el plan o en DEPLOY_CHECKLIST lo que no sea comprobable desde código.
```

---

## Instrucciones para todos los agentes

1. **Leer primero** este plan y [DEPLOY_CHECKLIST](DEPLOY_CHECKLIST.md). Si hay conflicto, este plan manda.
2. **Completar tareas** en orden: Fase 0 → Fase 1 → Fase 2 (por prioridad).
3. **Actualizar estado:** al terminar una tarea, marcar en el checklist correspondiente o añadir una línea en "Estado" en este doc (opcional).
4. **No parar:** si tu asignación está completa, toma una tarea de Fase 2 o ayuda en otra asignación.
5. **Verificar:** antes de cerrar, ejecutar `npm run verify` (y `./scripts/deploy_verify.sh <URL>` si tocas algo que afecte producción).
6. **No desplegar automáticamente** a producción sin que esté documentado; sí se puede hacer deploy a dev/preview.

---

## Referencias rápidas

- [DEPLOY_CHECKLIST](DEPLOY_CHECKLIST.md) — Checklist oficial deploy.
- [TEST_FIRST_SALE](TEST_FIRST_SALE.md) — Procedimiento primera venta.
- [CHECKLIST_PRIMERA_VENTA](CHECKLIST_PRIMERA_VENTA.md) — Pasos primera venta.
- [ENV_Y_STRIPE](ENV_Y_STRIPE.md) — Variables y Stripe.
- [STATUS](../STATUS.md) — Estado de módulos y track Deploy.
- [PLAN_AGENTES_CIERRE_VENTA](PLAN_AGENTES_CIERRE_VENTA.md) — Plan detallado front/back/QA.
- [QA_FASE3_PASOS_MANUALES](QA_FASE3_PASOS_MANUALES.md) — Pasos manuales para webhook y flujo.

---

*Última actualización: plan creado para coordinación de agentes y salida a producción. La plataforma debe estar siempre en mejoras.*
