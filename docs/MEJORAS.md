# Mejoras priorizadas — Nebula Smile

Documento vivo: qué hacer antes de lanzar, qué después, y mejoras técnicas ya aplicadas.

---

## Prioridades del proyecto

1. Estabilidad en producción  
2. Correctitud de pagos  
3. Fiabilidad del pipeline de leads  
4. Fiabilidad de la automatización  
5. Visibilidad operativa  
6. Lanzamiento rápido e ingresos  

Evitar complejidad que retrase el go-live.

---

## Antes de lanzar (bloqueantes)

Completar en este orden. No lanzar sin esto.

| # | Mejora | Dónde | Estado |
|---|--------|-------|--------|
| 1 | **Deploy en Vercel** — repo conectado, env configurados, deploy desde rama (dev) | [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) §1 | ✅ Hecho (dev) |
| 2 | **Webhook Stripe en prod** — URL correcta, evento `checkout.session.completed`, secret en Vercel, redeploy | §2 | ✅ Configurado; falta probar "Send test webhook" |
| 3 | **Smoke en prod** — `/api/health` y `/api/health/ready` en 200; flujo assessment → lead → depósito → checkout; comprobar DB | §3 | 🔶 Health OK; falta flujo completo una vez |

Cuando todo esté hecho: marcar track **Deploy** como ✅ en [STATUS.md](../STATUS.md).

---

## Mejoras técnicas ya aplicadas

- **Idempotencia del webhook Stripe:** el handler solo actualiza `payments` cuando `status = 'pending'`. En reintentos de Stripe devuelve 200 sin re-ejecutar lógica ni fallar. Ver `app/api/stripe/webhook/route.ts`.

---

## Después del lanzamiento (no bloqueantes)

Implementar cuando la app esté en producción y estable.

| Área | Mejora | Beneficio |
|------|--------|-----------|
| **Pagos** | Constraint `UNIQUE(stripe_checkout_session_id)` en tabla `payments` (si no existe) | Evita filas duplicadas por race; refuerza idempotencia. |
| **Observabilidad** | Sentry (o similar) para errores en prod; Vercel Analytics si se quiere tráfico | Detección rápida de fallos y visibilidad. |
| **Staging** | Proyecto Supabase + Vercel Preview para QA antes de merge a prod | Menos riesgo en cambios. |
| **Next.js** | Migrar `middleware` a convención `proxy` cuando Next lo recomiende estable | Alineado con roadmap de Next; no urgente. |
| **Dominio** | Dominio custom en Vercel cuando se decida marca/URL final | Profesionalismo y SEO. |

---

## Riesgos a vigilar

- Webhook mal configurado (URL, evento o secret incorrectos).  
- Variables de entorno faltantes o erróneas en Vercel.  
- Políticas RLS en Supabase prod (revisar antes de go-live).  
- Errores silenciosos: mejorar logging en rutas críticas (leads, stripe, admin) si no hay Sentry.

---

## Cómo probar cambios

- **Local:** `npm run verify` (lint + test + build).  
- **Webhook local:** `stripe listen --forward-to localhost:3000/api/stripe/webhook` y pagar con tarjeta de test.  
- **Prod:** seguir [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) y [PRODUCCIÓN_CHECKLIST.md](PRODUCCIÓN_CHECKLIST.md).

---

*Última actualización: alineado con sprint Deploy & production verification.*
