# Informe de auditoría detallado — Nebula Smile

**Fecha:** 2026-03-08  
**Alcance:** Repositorio, CI, configuración, seguridad, documentación e infraestructura (sin modificar código ni provisionar servicios).

---

## 1. Resumen ejecutivo

| Área | Estado | Notas |
|------|--------|--------|
| **Código y build** | ✅ Sano | Lint, 69 tests, build OK. Next.js 16, React 19, TypeScript. |
| **CI** | ✅ Verde | Último run en `main`: success (PR #26). |
| **Configuración** | ✅ Consistente | Env centralizado en `lib/config/server.ts` + Zod; sin secretos en repo. |
| **Seguridad** | ✅ Aceptable | Headers de seguridad, RLS en migraciones, `.env*` en .gitignore. |
| **Documentación** | ✅ Muy amplia | 100+ docs en `docs/`; estrategia de entornos y deployment definida. |
| **Infraestructura (local)** | ⚠️ Parcial | Vercel no logueado; Supabase CLI no instalado; repo no linkeado a Vercel. |

---

## 2. Stack y dependencias

### 2.1 Package.json

- **Nombre:** `smile-transformation-platform` (coherente con “Nebula Smile” en docs).
- **Versión:** 0.1.0, private: true.
- **Runtime:** Node 20 en CI; Next.js 16.1.6, React 19.2.3.
- **Dependencias principales:** `@supabase/ssr`, `@supabase/supabase-js`, `next`, `react`, `react-dom`, `stripe`, `zod`.
- **Dev:** ESLint 9, Vitest 4, TypeScript 5, Tailwind 4.

### 2.2 Scripts

| Script | Uso |
|--------|-----|
| `dev` | next dev |
| `build` | next build --webpack |
| `start` | next start |
| `lint` | eslint . |
| `test` | vitest run |
| `verify` | bash scripts/verify_all.sh (lint + test + build) |
| `db:migrate` | bash scripts/run_migrations.sh |

---

## 3. Calidad de código y pruebas

### 3.1 Lint

- **Resultado:** ✅ Sin errores (ESLint con eslint-config-next).

### 3.2 Tests

- **Archivos:** 23.
- **Tests:** 69, todos pasando.
- **Cobertura funcional:** health, auth/roles, assessment, leads API, Stripe checkout/webhook, automation, outbound, admin validación, providers, payments, smoke.

### 3.3 Build

- **Resultado:** ✅ Compilación correcta.
- **Rutas:** 63 rutas App Router (estáticas y dinámicas); middleware proxy.

---

## 4. CI/CD

### 4.1 Workflow (`.github/workflows/ci.yml`)

- **Disparadores:** push y PR en `main`, `staging`, `dev`, `feature/**`, `hotfix/**`; workflow_dispatch.
- **Concurrencia:** por workflow + ref; cancel-in-progress.
- **Job único:** lint-and-build (checkout, Node 20, npm ci, lint, test, env_check.sh, build).
- **Env en CI:** placeholders para Supabase, Stripe, OpenAI, CRON; sin secretos reales.

### 4.2 Estado reciente

- **Último run en `main`:** completed, **success** (fix thank-you page dependencies #26).
- **Conclusión:** CI estable y verde.

---

## 5. Configuración y variables de entorno

### 5.1 Modelo

- **Servidor:** `lib/config/server.ts` — Zod valida env; `getServerConfigSafe()` usado en libs (packages, leads, providers, specialists, bookings, etc.).
- **Cliente:** `lib/config/public.ts` — NEXT_PUBLIC_* para Supabase y Stripe publishable.
- **Build:** CI y build usan placeholders; no se inyectan secretos en el repo.

### 5.2 Variables requeridas (documentadas)

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Stripe: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Opcionales: OPENAI_*, AUTOMATION_CRON_SECRET, CRON_SECRET, DATABASE_URL, outbound, rate limit, etc.

### 5.3 .gitignore

- `.env*` ignorado; excepciones: `.env.example`, `.env.local.example`, `.env.development.example`, `.env.staging.example`, `.env.production.example`.
- `.vercel` ignorado (link local no versionado).

### 5.4 Secretos en código

- **Búsqueda:** No hay `sk_live`, `sk_test_xxx` reales ni `whsec_` reales en código de aplicación.
- **Tests:** Uso de `whsec_webhook` solo en tests (fixture); aceptable.

---

## 6. Seguridad

### 6.1 Headers (next.config.ts)

- X-DNS-Prefetch-Control, X-Frame-Options (SAMEORIGIN), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy (cámara/micro/geolocation restringidos).

### 6.2 Base de datos (RLS)

- **Migraciones:** Múltiples políticas RLS en 0001, 0010, 0011, 0013–0018 (packages, leads, payments, assets, providers, specialists, etc.).
- **Patrón:** SELECT público solo donde corresponde (p. ej. packages published); admin vía `is_admin()` o service role en servidor.

### 6.3 API y roles

- Rutas admin protegidas por verificación de sesión/rol (auth, guards).
- Stripe webhook: verificación de firma con `STRIPE_WEBHOOK_SECRET`.
- Endpoints de automation/cron: protección por secret (AUTOMATION_CRON_SECRET / CRON_SECRET).

---

## 7. Estructura de la aplicación

### 7.1 Páginas (App Router)

- **Públicas:** `/`, `/assessment`, `/packages`, `/packages/[slug]`, `/thank-you`, `/login`, `/signin`, `/signup`, `/legal`, `/health-packages`, `/tour-experiences`, `/specialists/[slug]`.
- **Admin:** `/admin`, `/admin/overview`, `/admin/leads`, `/admin/leads/[id]`, `/admin/providers`, `/admin/specialists`, `/admin/experiences`, `/admin/bookings`, `/admin/consultations`, `/admin/assets`, `/admin/outbound`, `/admin/status`, etc.
- **Por rol:** `/patient`, `/provider`, `/specialist`, `/coordinator` (con guards).

### 7.2 API (42 rutas)

- Health: `/api/health`, `/api/health/ready`.
- Auth: `/api/auth/me`, `/api/auth/signout`.
- Leads: `/api/leads`; admin: leads, leads/[id], outbound, etc.
- Stripe: `/api/stripe/checkout`, `/api/stripe/webhook`.
- Automation: `/api/automation/worker`, `/api/automation/outbound-worker`, `/api/automation/followups`, `/api/automation/payments-reconcile`.
- AI: `/api/ai/triage`, respond, itinerary; admin variants.
- Admin: providers, specialists, experiences, bookings, consultations, assets, payments/metrics, status/automation, outbound, etc.

---

## 8. Base de datos (Supabase)

### 8.1 Migraciones

- **Cantidad:** 20 archivos (0001_init.sql → 0020_leads_recommended_package.sql).
- **Orden:** Documentado en `supabase/migrations/MIGRATION_ORDER.md`.
- **Ejecución:** `npm run db:migrate` o SQL Editor en orden.

### 8.2 Seeds

- **Scripts:** `seed_packages.sql`, `seed_marketplace_foundation.sql`, `seed_curated_network.sql`, `seed_medical_tourism.sql`.
- **Uso:** Opcional tras migraciones; documentado en PRODUCTION_PACKAGE_SLUGS_FIX.md para paquetes de landing (packages-only SQL).

---

## 9. Documentación

### 9.1 Volumen

- **docs/:** ~100 archivos .md (setup, deployment, estrategia, auditorías, planes, checklists).

### 9.2 Documentos clave

| Doc | Propósito |
|-----|-----------|
| ENVIRONMENTS.md | Dos entornos (Production / Staging), vars por entorno |
| DEPLOYMENT_STRATEGY.md | Vercel/Supabase/Stripe, ramas, qué crear a mano |
| ENV_Y_STRIPE.md | Variables y configuración Stripe |
| VERCEL_SETUP.md | Env en Vercel, deploy, verificación |
| TEST_FIRST_SALE.md | Flujo primera venta (assessment → admin → Stripe → DB) |
| PRODUCTION_PACKAGE_SLUGS_FIX.md | SQL packages-only para slugs del landing |
| AUTH_AND_ROLES.md, DASHBOARD_ROLES.md | Roles y dashboards |
| MIGRATION_ORDER.md | Orden de migraciones |

### 9.3 Duplicación

- Varios checklists y guías de deploy (DEPLOY_CHECKLIST, DEPLOYMENT_CHECKLIST, PRODUCTION_CHECKLIST, etc.); conviene un índice o “doc maestro” para no duplicar mantenimiento.

---

## 10. Infraestructura y linkage (verificación local)

### 10.1 Vercel

| Check | Resultado |
|-------|-----------|
| CLI | Instalado (46.0.5) |
| Login | No (no credentials) |
| .vercel/project.json | No existe (repo no linkeado localmente) |
| vercel env ls | No ejecutable sin login |

**Recomendación:** `vercel login` y `vercel link` en la raíz para poder usar `vercel env ls` y comprobar Production vs Preview.

### 10.2 Supabase

| Check | Resultado |
|-------|-----------|
| CLI | No instalado |
| projects list / link | No comprobable |

**Recomendación:** Instalar Supabase CLI (`npm install -g supabase` o brew) y `supabase login` para listar proyectos y, si se desea, linkear el repo.

### 10.3 Git y ramas

- **Rama actual típica:** main.
- **Remote:** origin → GitHub (cloudsysops/smile-transformation-platform-).
- **Ramas:** main, staging, production-hardening, feature/*, fix/*.
- **Modelo documentado:** main → Production; otras ramas / PRs → Preview. Coherente con DEPLOYMENT_STRATEGY.md.

---

## 11. Riesgos y observaciones

### 11.1 No críticos

- **Log en tests:** “Lead-created automation enqueue failed … supabase.from(...).upsert is not a function” en tests de leads; los tests pasan (mock/entorno de test). Revisar si el contrato de Supabase mock está al día.
- **Documentación abundante:** Muchos docs similares; riesgo de desincronización. Útil un INDEX.md o README en docs/ con enlaces a los documentos canónicos.

### 11.2 Dependencias

- **npm audit:** No ejecutado en esta auditoría. Recomendación: ejecutar `npm audit` y corregir vulnerabilidades altas/críticas antes de producción.

### 11.3 Entornos

- Sin login/link no se pudo comprobar que en Vercel existan dos conjuntos de env (Production vs Preview) y que no se mezclen Supabase prod/staging. Debe validarse en Dashboard según ENVIRONMENTS.md.

---

## 12. Checklist de estado (resumen)

| Ítem | Estado |
|------|--------|
| Lint | ✅ OK |
| Tests (69) | ✅ OK |
| Build | ✅ OK |
| CI en main | ✅ Verde |
| Secretos en código | ✅ Ninguno en app (solo fixture en test) |
| .env en .gitignore | ✅ OK |
| Headers de seguridad | ✅ Configurados |
| RLS en migraciones | ✅ Múltiples políticas |
| Estrategia de entornos | ✅ Documentada (ENVIRONMENTS, DEPLOYMENT_STRATEGY) |
| Migraciones y seeds | ✅ Orden y scripts documentados |
| Vercel (local) | ⚠️ Login y link pendientes |
| Supabase CLI (local) | ⚠️ No instalado |

---

## 13. Próximos pasos recomendados (sin cambiar código)

1. **Local:** Ejecutar `vercel login`, `vercel link`, y luego `vercel env ls` para auditar variables y scopes (Production vs Preview).
2. **Opcional:** Instalar Supabase CLI, `supabase login`, `supabase projects list` y, si aplica, `supabase link` al proyecto adecuado.
3. **Vercel Dashboard:** Confirmar Production Branch = main y que las env requeridas existan para Production y Preview según ENVIRONMENTS.md.
4. **Seguridad:** Ejecutar `npm audit` y abordar hallazgos altos/críticos.
5. **Documentación:** Crear o actualizar un índice en `docs/` (p. ej. README.md o INDEX.md) con enlaces a los documentos maestros (entornos, deployment, primera venta, migraciones).

---

*Informe generado por auditoría de solo lectura. No se modificó código ni se provisionó infraestructura.*
