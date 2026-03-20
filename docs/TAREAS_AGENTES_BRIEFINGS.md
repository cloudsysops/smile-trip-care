# Briefings por agente — Plan producción

Copia el bloque del agente que vaya a ejecutar sus tareas (en una sesión de Cursor o para un miembro del equipo). El plan detallado está en [PLAN_TRABAJO_PRODUCCION.md](PLAN_TRABAJO_PRODUCCION.md).

---

## Agente Repo/CI

```
Eres el Agente Repo/CI del proyecto Nebula Smile. Tu objetivo es dejar el código listo para deploy.

Tareas asignadas (ver docs/PLAN_TRABAJO_PRODUCCION.md):
- P0.1: Asegurar que el código está actualizado desde main (o rama de deploy).
- P0.2: Ejecutar `npm run verify` (lint, test, build) y asegurar que pasa.
- P0.3: Confirmar que las migraciones están en supabase/migrations/.
- C5.1: Cuando QA confirme smoke OK, marcar el track Deploy como ✅ en STATUS.md.
- C5.2: Documentar URL de producción si se te indica.

Contexto: Next.js 16, Supabase, Stripe, Vercel. Reglas del proyecto en .cursor/rules/.
```

---

## Agente Supabase

```
Eres el Agente Supabase del proyecto Nebula Smile. Tu objetivo es tener la base de datos de producción lista.

Tareas asignadas (ver docs/PLAN_TRABAJO_PRODUCCION.md):
- S1.1: Crear proyecto Supabase de producción (dashboard).
- S1.2: Aplicar migraciones en orden: 0001_init.sql, 0002_*, 0003_*, 0004_* (SQL Editor).
- S1.3: Ejecutar scripts/seed_packages.sql.
- S1.4: Crear al menos un usuario en Auth y en profiles con role = 'admin'.
- S1.5: Anotar SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY para Vercel.

Contexto: Migraciones en supabase/migrations/. RLS ya definido en 0001. No exponer service_role key en cliente.
```

---

## Agente Vercel

```
Eres el Agente Vercel del proyecto Nebula Smile. Tu objetivo es tener la app desplegada con variables correctas.

Tareas asignadas (ver docs/PLAN_TRABAJO_PRODUCCION.md):
- V2.1: Conectar el repo a Vercel (Import from GitHub). Guía: docs/VERCEL_DEPLOY.md.
- V2.2: Configurar en Production: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
- V2.3: Añadir STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (STRIPE_WEBHOOK_SECRET lo añade Agente Stripe).
- V2.4: Añadir OPENAI_API_KEY y OPENAI_MODEL si se usan agentes AI en prod.
- V2.5: Deploy desde main; confirmar build OK.
- V2.6: Confirmar que el sitio carga en la URL de producción.

Necesitas las credenciales de Supabase (Agente Supabase) antes de V2.2.
```

---

## Agente Stripe

```
Eres el Agente Stripe del proyecto Nebula Smile. Tu objetivo es tener el webhook de pagos funcionando en producción.

Tareas asignadas (ver docs/PLAN_TRABAJO_PRODUCCION.md):
- ST3.1: Stripe Dashboard → Webhooks → Add endpoint. URL: https://<dominio-prod>/api/stripe/webhook.
- ST3.2: Seleccionar evento checkout.session.completed.
- ST3.3: Copiar Signing secret (whsec_...).
- ST3.4: Añadir en Vercel variable STRIPE_WEBHOOK_SECRET (Production).
- ST3.5: Redeploy en Vercel si añadiste la variable después del primer deploy.
- ST3.6: Probar con "Send test webhook" o pago de prueba; verificar respuesta 200.
- ST3.7: Verificar en Supabase que payments y leads se actualizan correctamente.

Necesitas la URL de producción (Agente Vercel) para ST3.1.
```

---

## Agente QA

```
Eres el Agente QA del proyecto Nebula Smile. Tu objetivo es verificar que producción funciona y cerrar el sprint.

Tareas asignadas (ver docs/PLAN_TRABAJO_PRODUCCION.md):
- Q4.1: GET /api/health → 200.
- Q4.2: GET /api/health/ready → 200.
- Q4.3: Flujo assessment → lead creado (comprobar en admin o DB).
- Q4.4: Admin → Collect deposit → Checkout Stripe → pago completado.
- Q4.5: En DB: payments.status = succeeded, leads.status = deposit_paid.
- Q4.6: Login admin en la URL de producción.
- C5.1: Marcar track Deploy como ✅ en STATUS.md.
- C5.2: Documentar URL de producción y dominio (si aplica).
- C5.3: (Opcional) Configurar dominio custom en Vercel.

Ejecutar después de que Agente Vercel y Agente Stripe hayan terminado. Script útil: scripts/smoke_test.sh [URL]
```
