# Auditoría reciente — Nebula Smile

*Fecha: marzo 2026. Tras configurar Vercel (dev), env (local + Vercel) y webhook Stripe.*

---

## 1. Estado actual

| Área | Estado | Notas |
|------|--------|--------|
| **Deploy (dev)** | ✅ | Vercel `smile-transformation-platform-dev`, env configuradas, deploy verify PASSED |
| **Supabase** | ✅ | health/ready OK; migraciones documentadas (incl. 0005 idempotencia) |
| **Stripe (config)** | ✅ | API keys + webhook endpoint + STRIPE_WEBHOOK_SECRET en Vercel |
| **Código** | ✅ | Webhook con raw body, firma, idempotencia (update solo si status=pending); 0005 UNIQUE en DB |
| **Tests / verify** | ✅ | `npm run verify` (lint + test + build); scripts deploy_verify y verify_production |
| **Docs** | ✅ | ENV_Y_STRIPE, GUIA_PASO_A_PASO_PRODUCCION, DEPLOY_CHECKLIST, CHECKLIST_PRIMERA_VENTA |

---

## 2. Pendiente para cerrar “Deploy” (track en STATUS.md)

1. **Probar webhook en producción**  
   Stripe Dashboard → tu endpoint → “Send test webhook” (evento `checkout.session.completed`) → debe devolver **200**.

2. **Flujo completo una vez**  
   Assessment → lead creado → admin → “Collect deposit” → checkout Stripe (tarjeta test) → comprobar en Supabase: `payments.status = succeeded`, `leads.status = deposit_paid`.

Cuando eso esté hecho, marcar el track **Deploy** como ✅ en [STATUS.md](../STATUS.md).

---

## 3. Con qué podemos seguir (priorizado)

### Inmediato (esta semana)

- **Cerrar Deploy:** hacer la prueba del webhook y el flujo completo arriba; marcar checklist en DEPLOY_CHECKLIST.md y STATUS.md.
- **Primera venta de prueba:** seguir [CHECKLIST_PRIMERA_VENTA.md](CHECKLIST_PRIMERA_VENTA.md) (assessment → lead → depósito → verificar DB).

### Corto plazo (próximas 2–4 semanas)

- **Observabilidad:** Sentry (o similar) para errores en prod; opcional Vercel Analytics.
- **Dominio custom:** configurar en Vercel cuando tengas el dominio final.
- **Entorno prod:** cuando quieras cobrar de verdad: nuevo proyecto Vercel (o rama prod), Supabase prod, Stripe Live, webhook prod, variables prod.

### Medio plazo (después de estabilizar)

- **Staging/QA:** Supabase + Vercel Preview (o proyecto aparte) para probar antes de prod.
- **Mejoras de producto:** según [MEJORAS.md](MEJORAS.md) (post-lanzamiento).

---

## 4. Riesgos / vigilar

- Webhook sin probar en prod (hacer “Send test webhook” y flujo real una vez).
- RLS en Supabase prod: revisar políticas antes de go-live real.
- Errores silenciosos: cuando añadas Sentry, revisar rutas críticas (leads, stripe, admin).

---

## 5. Resumen ejecutivo

El proyecto está **~90% listo** para operar en **dev**: código, DB, Stripe (config + idempotencia), docs y scripts de verificación están alineados. Falta **validar en vivo** el webhook y un flujo completo (assessment → pago → DB) y luego marcar Deploy como cerrado. Después: primera venta de prueba, observabilidad y, cuando toque, entorno prod con Stripe Live.
