# Auditoría técnica del proyecto: Nebula Smile

Documento para dar contexto completo a ChatGPT u otra IA para ayudar en tareas de desarrollo, deploy y debugging.

**Este documento resume:**
- Qué tenemos construido
- Qué falta para producción
- Qué riesgos existen
- Cómo puede ayudar la IA

---

## 1. Contexto del proyecto

**Nebula Smile** es una plataforma web de **coordinación de salud + turismo médico**.

- Los pacientes solicitan tratamientos a través de un **assessment** y el equipo administra los leads desde un **panel admin**.
- Luego se cobra un **depósito por Stripe** y se gestiona el itinerario del paciente.

**Ubicaciones:** Medellín, Manizales  
**Clínica asociada:** Clínica San Martín  

**Objetivo de negocio:** Lanzar rápido, vender paquetes reales y operar con estabilidad.

---

## 2. Stack tecnológico

| Área | Tecnología |
|------|------------|
| **Frontend / Backend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| **Base de datos** | Supabase, Postgres, Row Level Security, Storage, Auth |
| **Pagos** | Stripe Checkout Sessions, webhook para `checkout.session.completed` |
| **IA** | OpenAI Agents: lead triage, respuesta al paciente, generación de itinerarios |
| **Validación** | Zod schemas |
| **Deploy** | Vercel |
| **CI/CD** | GitHub Actions: lint, tests (Vitest), build. Local: `npm run verify` |

---

## 3. Qué tenemos construido

### Frontend

- **Landing** (`/`): hero, paquetes, assets desde DB, CTA al assessment.
- **Assessment** (`/assessment`): formulario, honeypot anti spam, prefill por query param, POST a `/api/leads`.
- **Thank you** (`/thank-you`): confirmación, muestra `lead_id`.
- **Packages** (`/packages/[slug]`): detalle de paquete por slug.

### Admin panel

- **Login:** `/admin/login`
- **Gestión de leads:** `/admin/leads`
- **Detalle de lead:** `/admin/leads/[id]` — cambiar status, cobrar depósito, usar AI (triage, reply, itinerary).
- **Assets:** subir, aprobar, publicar.
- **Dashboard de estado:** `/admin/status`

Todas las rutas admin protegidas por sesión + `requireAdmin()`.

---

## 4. APIs

### Públicas

- **POST `/api/leads`** — Zod validation, honeypot, rate limit, inserta lead con service role.

### Stripe

- **POST `/api/stripe/checkout`** — crea sesión checkout (admin only).
- **POST `/api/stripe/webhook`** — verifica firma, procesa `checkout.session.completed`, actualiza `payments` y `leads`.

### Health

- **GET `/api/health`**
- **GET `/api/health/ready`** — comprueba conexión Supabase.

### Admin APIs

- Leads CRUD, assets CRUD, upload assets.
- AI: triage, response, itinerary (bajo `/api/ai/*` y `/api/admin/ai/*`).

---

## 5. Base de datos

| Migración | Contenido |
|-----------|-----------|
| **0001_init.sql** | profiles, packages, leads, payments, assets, itineraries, lead_ai; RLS; `is_admin()` |
| **0002** | Assets extendidos |
| **0003 / 0004** | Extensiones para AI (lead_ai) |

**Seed:** `scripts/seed_packages.sql` (smile-medellin, smile-manizales) — ejecutar tras migraciones.

---

## 6. Seguridad

- **Service role:** solo en servidor (nunca en cliente).
- **Stripe webhook:** usa `request.text()` y `Stripe.webhooks.constructEvent(payload, signature, secret)`.
- **RLS:** activo en todas las tablas.
- **Admin:** `requireAdmin()` en todas las rutas y APIs admin.
- **Middleware:** protege `/admin`; redirige a login si no hay sesión.

---

## 7. Tests

- **Vitest.** Tests: health, leads API, admin validation, AI schemas (~12 tests).
- Comando: `npm run test`; pipeline completo: `npm run verify`.

---

## 8. Documentación existente

| Archivo | Contenido |
|---------|-----------|
| `STATUS.md` | Estado de módulos y track Deploy |
| `README.md` | Arranque, scripts, verify |
| `docs/DEPLOY_CHECKLIST.md` | Checklist de deploy (Vercel, Stripe, smoke) |
| `docs/VERCEL_DEPLOY.md` | Configuración Vercel y webhook URL |
| `docs/PROMPT_CHATGPT.md` | Contexto listo para pegar en IA |
| `docs/ENGINEERING_HANDBOOK.md` | Guía técnica |
| `docs/SECURITY_COMPLIANCE.md` | Seguridad |

---

## 9. Qué falta para lanzar (bloqueante)

### Deploy en producción

- Crear proyecto en Vercel, conectar GitHub, configurar variables de entorno, deploy desde `main`.

**Variables necesarias:**

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
OPENAI_API_KEY (opcional)
OPENAI_MODEL (opcional)
```

### Webhook Stripe en producción

- En Stripe Dashboard: crear endpoint **URL** `https://<dominio>/api/stripe/webhook`, evento `checkout.session.completed`.
- Copiar **Signing secret** → poner en Vercel como `STRIPE_WEBHOOK_SECRET` → redeploy si hace falta.

### Smoke tests en producción

- Probar `GET /api/health` y `GET /api/health/ready` (200).
- Flujo completo: assessment → lead → admin → depósito → checkout → webhook → verificar actualización en DB.

---

## 10. Mejoras recomendadas (no bloqueantes)

- **Idempotencia Stripe:** constraint `UNIQUE(stripe_checkout_session_id)` en `payments` para evitar duplicados; o actualizar solo si `status = 'pending'`.
- **Middleware Next.js:** migrar de `middleware` a `proxy` (Next recomienda; no urgente).
- **Observabilidad:** Sentry, Vercel Analytics.
- **Staging:** entorno staging vs production (otro proyecto Vercel o preview con Supabase/Stripe test).
- **Dominio custom:** configurar en Vercel cuando se decida.

---

## 11. Riesgos actuales

Riesgos antes de producción:

- Webhook mal configurado (URL o evento incorrecto, secret no en Vercel).
- Variables de entorno faltantes o erróneas en producción.
- RLS mal configurado (revisar políticas en Supabase prod).
- Pagos duplicados si se crean dos filas para la misma sesión (mitigar con constraint o idempotencia).
- Errores silenciosos en APIs (recomendable añadir logging/observabilidad).

---

## 12. Cómo usar esta auditoría con ChatGPT

1. **Primero** pega el contenido de `docs/PROMPT_CHATGPT.md` (contexto + instrucciones).
2. **Luego** pega las secciones 1 y 2 de este documento (contexto del proyecto + stack).
3. **Después** escribe tu pregunta.

**Ejemplo:**  
*"Según la auditoría del proyecto Nebula Smile, necesitamos configurar el webhook de Stripe en Vercel. Dame los pasos exactos."*

---

## 13. Ejemplos de preguntas para IA

| Área | Ejemplo |
|------|--------|
| **Debugging** | "Estoy recibiendo error 500 en /api/leads, ¿cómo lo depuro?" |
| **Deploy** | "Guíame paso a paso para desplegar el proyecto en Vercel." |
| **Pagos** | "Verifica que el webhook de Stripe esté implementado correctamente." |
| **Seguridad** | "Revisa si las políticas RLS de Supabase son seguras." |
| **Performance** | "Cómo optimizar APIs de Next.js con Supabase." |
| **Stripe** | "Dame los pasos exactos para añadir el webhook en Stripe Dashboard para producción." |

---

## 14. Estado del proyecto

| Dimensión | Valor aproximado |
|-----------|------------------|
| **Arquitectura** | 8.5 / 10 |
| **Seguridad** | 8 / 10 |
| **Producción** | 7.5 / 10 |
| **Estado general** | ~85–90 % listo |

**Lo único realmente pendiente para poder vender en vivo:**

1. Deploy en Vercel  
2. Webhook Stripe en producción  
3. Smoke test real en producción  

Una vez hecho eso, el sistema está listo para operar. Estimación: **medio día de trabajo** para un desarrollador que ya conozca el repo.

---

**Documentos relacionados:** [AUDITORIA_EJECUCION.md](AUDITORIA_EJECUCION.md) (resultado de la última ejecución), [PROMPT_AUDITORIA_CHATGPT.md](PROMPT_AUDITORIA_CHATGPT.md) (prompt listo con la auditoría para pegar en ChatGPT).

---

*Auditoría para IA — Nebula Smile. Actualizar este documento cuando cambie el estado del proyecto.*
