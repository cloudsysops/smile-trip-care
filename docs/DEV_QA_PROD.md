# DEV → QA → Prod: entornos y salida a producción

## Resumen

| Entorno | Backend | Frontend | Uso |
|---------|---------|----------|-----|
| **DEV** | Supabase local (Docker) | `npm run dev` (localhost:3000) | Desarrollo diario |
| **QA** | Supabase proyecto staging (cloud) | Vercel Preview (rama/PR) | Pruebas antes de prod |
| **Prod** | Supabase proyecto prod | Vercel Production (main) | Vender / clientes reales |

---

## 1. DEV local (Docker)

Todo en tu máquina; no gastas cloud.

### Requisitos

- **Docker** en marcha (Docker Desktop).
- **Supabase CLI**: `brew install supabase/tap/supabase` (o `bash scripts/instalar-herramientas-dev.sh` desde el repo `proyectos`).

### Arrancar

```bash
# Desde smile-transformation-platform
./scripts/dev-local.sh
```

Eso comprueba Docker y Supabase CLI, ejecuta `supabase start` (Docker) y te muestra las variables para `.env.local`.

1. Crea o edita `.env.local` y pega **API URL** y **anon** / **service_role** keys que salen en `supabase status`.
2. Opcional: Stripe en local con `stripe listen --forward-to localhost:3000/api/stripe/webhook` y el `whsec_...` en `.env.local`.
3. Levanta la app: `npm run dev` → http://localhost:3000.

### Migraciones locales

Las migraciones en `supabase/migrations/` se aplican al arrancar con `supabase start`. Si añades nuevas:

```bash
supabase db reset   # reaplica todas las migraciones (borra datos locales)
# o
supabase migration up
```

### Parar

```bash
supabase stop
```

---

## 2. QA (staging / preview)

Para probar en un entorno tipo producción antes de pasar a prod.

### Opción A: Vercel Preview + mismo Supabase (rápido)

- Creas una rama (ej. `staging` o por PR).
- Vercel despliega una **Preview** con su URL.
- En Vercel → Settings → Environment Variables: asignas las mismas variables de **Preview** a un proyecto Supabase de **staging** (recomendado) o, solo para pruebas suaves, al mismo proyecto que prod (no ideal).

### Opción B: Proyecto Supabase “staging” (recomendado)

1. En [Supabase](https://supabase.com/dashboard) creas un segundo proyecto, ej. `smile-staging`.
2. Ejecutas las mismas migraciones (SQL Editor o `supabase db push` con link a ese proyecto).
3. En Vercel, en **Preview** env, pones las variables de ese proyecto staging (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).
4. Cada PR o push a `staging` despliega en una URL de preview que usa la DB de staging.

Así QA no toca datos de producción.

---

## 3. Prod (listos para vender)

### Checklist antes de salir a producción

- [ ] **Vercel**
  - Proyecto importado desde GitHub; despliegue en **Production** desde `main`.
  - Variables de **Production** configuradas (Supabase prod, Stripe live).
- [ ] **Supabase (prod)**
  - Proyecto prod creado.
  - Migraciones aplicadas (`0001_init.sql`, `0002_*`, `0003_*`, `0004_*` y `scripts/seed_packages.sql` si aplica).
  - RLS y políticas probadas.
- [ ] **Stripe (live)**
  - Modo **Live** activado en el Dashboard.
  - Claves live en Vercel (Production): `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
  - Webhook de producción apuntando a `https://tu-dominio.com/api/stripe/webhook` (o la ruta que uses).
  - `STRIPE_WEBHOOK_SECRET` en Vercel = signing secret del webhook **live**.
- [ ] **Dominio**
  - En Vercel: dominio custom (ej. `app.tudominio.com`) o el que vayas a usar para vender.
  - SSL automático con Vercel.
- [ ] **Auth / Admin**
  - Al menos un usuario admin en Supabase (Auth) con `profiles.role = 'admin'`.
  - Probado login admin en la URL de producción.
- [ ] **Smoke en prod**
  - Landing carga; assessment envía lead; webhook Stripe en prod recibe evento y actualiza estado (p. ej. deposit_paid).
  - Health: `GET /api/health` y `/api/health/ready` responden OK.

### Comandos útiles

```bash
# Verificar que el código pasa CI (lint + test + build)
./scripts/verify_all.sh

# Deploy a prod: push a main (si Vercel está conectado)
git push origin main
```

### Documentación relacionada

- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) – Conectar GitHub con Vercel y variables.
- [TEST_STEPS.md](./TEST_STEPS.md) – Pasos de prueba por módulo.

---

## Resumen de comandos por entorno

| Acción | Comando / Dónde |
|--------|------------------|
| DEV: arrancar backend local | `./scripts/dev-local.sh` (Supabase en Docker) |
| DEV: arrancar app | `npm run dev` |
| DEV: parar Supabase | `supabase stop` |
| QA: desplegar preview | Push a rama o abrir PR → Vercel Preview |
| Prod: desplegar | Push a `main` → Vercel Production |
| Prod: webhook Stripe | Configurar en Stripe Dashboard → URL prod + secret en Vercel |

Cuando el checklist de prod esté cubierto y los smoke tests pasen, puedes considerar la app lista para vender (con Stripe en live y dominio configurado).
