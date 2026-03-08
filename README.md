# Nebula Smile

**AI-Powered Medical Tourism Platform**

---

## Overview

Nebula Smile is a coordination and hospitality platform (USA LLC) connecting international patients with verified dental clinics in Colombia. Medical services are billed by clinics in Colombia. The platform offers free smile assessments, curated packages, concierge travel coordination, and savings up to 70% for dental transformation in Medellín and Manizales.

**🤖 Agentes (IA):** Run the **Sprint Salir a vender** ([docs/SPRINT_SALIR_A_VENDER.md](docs/SPRINT_SALIR_A_VENDER.md)) first; then [AGENTS.md](AGENTS.md) and [docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md](docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md). Goal: production ready to sell and continuous improvements.

---

## Tech stack

- **App:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Data & Auth:** Supabase (Postgres, Auth, Storage, RLS)
- **Payments:** Stripe (Checkout, webhooks)
- **Deploy:** Vercel
- **CI:** GitHub Actions (lint, test, build)

---

## Development workflow

**Run all commands from the project root.** If you cloned the repo and the code is in `smile-transformation-platform/`:

```bash
cd smile-transformation-platform
```

**Conectar Supabase y Vercel:** [docs/CONECTAR_SUPABASE_VERCEL.md](docs/CONECTAR_SUPABASE_VERCEL.md) — create Supabase project, migrations, env vars, and Vercel deploy.

### Migraciones con Supabase CLI

Ejecuta todo **desde la raíz del proyecto** (no hagas `cd smile-transformation-platform` si ya estás dentro):

```bash
npx supabase login
npx supabase link --project-ref ymkqvzanvnbcxisnurle
npm run db:migrate
```

Si aparece *"Access token not provided"*, el primer paso (`npx supabase login`) abre el navegador para autenticarte. Después de eso, `link` y `db:migrate` deberían funcionar.

Si la base remota ya tenía el esquema aplicado a mano y `db push` falla (p. ej. "policy already exists"), puedes marcar migraciones como aplicadas y luego empujar solo las nuevas: `npx supabase migration repair 0001 --status applied` (y 0002… hasta la última que ya esté en remoto), luego `npm run db:migrate`.

### Arrancar en local

```bash
cd smile-transformation-platform   # si no estás ya en la raíz del proyecto
npm install
cp .env.example .env.local         # rellenar SUPABASE_URL (API), DATABASE_URL (Postgres para migraciones/seeds) y Stripe
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Scripts

| Comando | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run test` | Tests (Vitest) |
| `npm run verify` | Verificación pre-deploy: lint + test + build |
| `npm run db:migrate` | Aplicar migraciones Supabase (requiere `supabase login` + `supabase link`) |
| `npm run smoke:assets` | Validación básica de assets (admin) |
| `./scripts/smoke_test.sh [URL]` | Smoke test: /api/health y /api/health/ready (default: http://localhost:3000) |
| `./scripts/verify_production.sh <URL>` | Verificación producción: health, ready, status, landing (requiere URL) |
| `./scripts/deploy_verify.sh <URL>` | Deploy completo: env, verify, migraciones (opcional), smoke contra URL |
| `./scripts/verify_all.sh` | Igual que verify (lint + test + build) |
| `./scripts/sprint-start.sh` | Inicio de sprint (verify + objetivo) |
| `./scripts/sprint-end.sh` | Cierre de sprint (verify + checklist PR/deploy) |
| `./scripts/dev-local.sh` | DEV con Supabase en Docker |

### Verificación pre-deploy

Antes de desplegar o hacer merge a `main`, ejecutar:

```bash
npm run verify
```

Equivale a `lint` → `test` → `build`. Si todo pasa, el código está listo para deploy. Checklist completo de producción: [docs/DEPLOY_CHECKLIST.md](docs/DEPLOY_CHECKLIST.md).

### Variables de entorno

- `.env.example` y `.env.local.example` listan las variables necesarias.
- **Obligatorias:** Supabase (URL, service_role, anon) + Stripe (secret, webhook secret, publishable). Ver **[Variables y Stripe](docs/ENV_Y_STRIPE.md)**.
- AI (opcional): `OPENAI_API_KEY`, `OPENAI_MODEL`.

## Branding

- **Favicon:** La app usa `app/icon.svg` (icono por defecto en la pestaña). Para sustituirlo por tu logo: reemplaza `app/icon.svg` o añade `app/icon.png` (32×32 o 48×48); Next.js lo sirve automáticamente.

## Estructura de la app

- **Público:** `/` (landing), `/assessment`, `/packages`, `/health-packages`, `/tour-experiences`, `/packages/[slug]`, `/thank-you`, `/legal`, `/signin`.
- **Admin:** `/admin` (redirige a overview), `/admin/overview` (KPIs), `/admin/leads`, `/admin/leads/[id]`, `/admin/assets`, `/admin/login`, `/admin/status`. Ver [STATUS](STATUS.md) y [DASHBOARDS_POR_ROL](docs/DASHBOARDS_POR_ROL.md).

## Contribuir y GitHub

- **[Configuración GitHub (enterprise / SaaS)](docs/GITHUB_ENTERPRISE_SETUP.md)** — Protección de ramas, CI, plantillas, Dependabot.
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Cómo contribuir (ramas, verify, PR).
- **[SECURITY.md](SECURITY.md)** — Cómo reportar vulnerabilidades.

## Documentación

- **[Conectar Supabase y Vercel](docs/CONECTAR_SUPABASE_VERCEL.md)** — Guía rápida para enlazar la app con Supabase y Vercel.
- **[Variables de entorno y Stripe](docs/ENV_Y_STRIPE.md)** — Lista de variables (obligatorias/opcionales) y checklist Stripe (API keys + webhook).
- [Estado de módulos](STATUS.md) — Módulos, migraciones, rutas.
- **[Modelo de datos y red curada](docs/DATA_MODEL.md)** — Entidades, aprobaciones, flujo. [CURATED_NETWORK_FOUNDATION](docs/CURATED_NETWORK_FOUNDATION.md).
- **[Dashboards por rol](docs/DASHBOARDS_POR_ROL.md)** — Admin, Especialista, Paciente, Proveedor (diseño y roadmap).
- **[Organización y mejora continua](docs/ORGANIZACION_Y_MEJORA_CONTINUA.md)** — Lista maestra, cadencia, reglas de limpieza.
- **[Auditoría buenas prácticas](docs/TAREAS_AUDITORIA_BUENAS_PRACTICAS.md)** — Tareas de auditoría (seguridad, validación, tests, docs). [Resultado](docs/AUDITORIA_RESULTADO.md).
- [Pasos de prueba](docs/TEST_STEPS.md)
- **[DEV / QA / Prod (Docker local → producción)](docs/DEV_QA_PROD.md)** – Entornos y cómo arrancar con Docker.
- **[Checklist producción (vender)](docs/PRODUCCIÓN_CHECKLIST.md)** – Lista para salir a producción.
- **[Sprint process](docs/SPRINT.md)** – Cadencia, ceremonias, sprint actual (Deploy & prod).
- **[Usar Cursor desde el móvil (GitHub + Cursor Mobile)](docs/CURSOR_MOBILE.md)**
- **[Conectar GitHub con Vercel y desplegar](docs/VERCEL_DEPLOY.md)**
- **[Checklist pre-deploy Vercel (env + verificación)](docs/VERCEL_PRE_DEPLOY_CHECKLIST.md)**
- **[Checklist deploy y verificación en producción](docs/DEPLOY_CHECKLIST.md)**
- **[Plan de trabajo: salir a producción y vender](docs/PLAN_TRABAJO_PRODUCCION.md)** — Fases 1–3, tareas y agentes
- **[Cómo crear el primer admin](docs/PRIMER_ADMIN.md)** — Supabase Auth + profiles.role
- **[Checklist primera venta](docs/CHECKLIST_PRIMERA_VENTA.md)** — Pasos para la primera venta en prod
- **[Test first sale](docs/TEST_FIRST_SALE.md)** — Procedimiento para probar lead → depósito → verificación en Supabase
- **[Mejoras priorizadas (antes y después de lanzar)](docs/MEJORAS.md)**
- **[Plan de trabajo para producción](docs/PLAN_TRABAJO_PRODUCCION.md)** — Fases, tareas por agente, criterios de aceptación.
- **[Briefings por agente](docs/TAREAS_AGENTES_BRIEFINGS.md)** — Textos para asignar tareas a agentes o equipo.
- **[Guía paso a paso a producción](docs/GUIA_PASO_A_PASO_PRODUCCION.md)** — Instrucciones detalladas para Supabase, Vercel, Stripe y pruebas (sin experiencia previa).
- **[Auditoría: lo que tenemos y lo que falta (para ChatGPT)](docs/AUDITORIA_PARA_CHATGPT.md)**
- **[Auditoría reciente (marzo 2026)](docs/AUDITORIA_RECIENTE.md)** — Estado actual y con qué seguir (Deploy, primera venta, observabilidad).
- **[Plan agentes: frontend, backend y cierre de venta](docs/PLAN_AGENTES_CIERRE_VENTA.md)** — Tareas por agente para mejorar front/back y verificar una venta completa.
- **[Plan de trabajo para agentes (producción y mejoras continuas)](docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md)** — Fase 0/1/2, tareas por agente, briefings.

## Usar con Cursor (desktop o móvil)

- Reglas del proyecto para la IA: `.cursor/rules.md`.
- Para **abrir este proyecto en Cursor Mobile** (iPhone/Android) o en **Cursor Agents** (web): sigue la guía [docs/CURSOR_MOBILE.md](docs/CURSOR_MOBILE.md) (crear repo en GitHub, conectar remoto, push, abrir desde la app o la web).

---

## Deployment

- **Platform:** Vercel. Connect the Git repo, set environment variables in the Vercel dashboard, and deploy from the `main` branch.
- **Checklists:** [docs/DEPLOY_CHECKLIST.md](docs/DEPLOY_CHECKLIST.md), [docs/VERCEL_PRE_DEPLOY_CHECKLIST.md](docs/VERCEL_PRE_DEPLOY_CHECKLIST.md), [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md).
- **Plan de trabajo para agentes (producción y mejoras continuas):** [docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md](docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md)

## Cómo vender

Flujo de venta: el cliente completa el **assessment** → se crea un **lead** → en **admin** se gestiona el lead y se envía el enlace "Collect deposit" → el cliente paga con **Stripe** (depósito) y el webhook actualiza el estado. Para probar el flujo completo: [docs/TEST_FIRST_SALE.md](docs/TEST_FIRST_SALE.md).
