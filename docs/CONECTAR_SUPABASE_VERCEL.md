# Conectar Supabase y Vercel al proyecto

Guía rápida para enlazar la app con Supabase (base de datos) y Vercel (hosting). Sigue los pasos en orden.

---

## Antes de empezar

- Tienes el código del proyecto (por ejemplo en `smile-transformation-platform/`).
- Cuenta en [Supabase](https://supabase.com) y en [Vercel](https://vercel.com) (puedes usar “Login with GitHub” en ambos).
- Repo subido a GitHub (necesario para conectar Vercel).

**Importante:** Todos los comandos `npm` y `./scripts/...` deben ejecutarse desde la **raíz del proyecto**:

```bash
cd smile-transformation-platform
```

---

## Parte 1 — Supabase (base de datos)

### 1. Crear proyecto en Supabase

1. Entra en [app.supabase.com](https://app.supabase.com) → **New project**.
2. **Name:** p. ej. `smile-prod`. **Database Password:** créala y guárdala. **Region:** la más cercana (ej. South America).
3. **Create new project** y espera 1–2 minutos.

### 2. Crear tablas (migraciones)

1. En Supabase: **SQL Editor** → **New query**.
2. En tu máquina, abre cada archivo **en este orden**, copia todo el contenido y pégalo en una nueva query → **Run**:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_assets_extended_unified.sql`
   - `supabase/migrations/0003_m9_ai_admin_connected.sql`
   - `supabase/migrations/0004_lead_ai_ops.sql`
   - `supabase/migrations/0005_payments_idempotency.sql`
   - `scripts/seed_packages.sql`
3. Si algo falla, revisa que el archivo anterior se haya ejecutado bien.

### 3. Crear usuario admin

1. **Authentication** → **Users** → **Add user** → **Create new user** (email + contraseña). Guarda la contraseña.
2. En la lista, abre ese usuario y **copia el UUID**.
3. **SQL Editor** → nueva query, ejecuta (cambia `TU-UUID` y el email si quieres):

```sql
insert into public.profiles (id, email, role)
values ('TU-UUID', 'tu-email@ejemplo.com', 'admin')
on conflict (id) do update set role = 'admin';
```

### 4. Copiar claves para la app

1. **Project Settings** (engranaje) → **API**.
2. Anota:
   - **Project URL** → lo usarás como `SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_URL`.
   - **anon public** (Reveal) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **service_role** (Reveal) → `SUPABASE_SERVICE_ROLE_KEY` (solo servidor, no la compartas).

---

## Parte 2 — Vercel (deploy de la app)

### 1. Importar el repo

1. Entra en [vercel.com](https://vercel.com) → **Add New…** → **Project**.
2. En **Import Git Repository** busca tu repo (ej. `smile-transformation-platform`). Si no sale, **Adjust GitHub App Permissions** y autoriza el repo.
3. **Import**.

### 2. Configuración del proyecto

- No cambies **Framework** (Next.js), **Root Directory**, **Build** ni **Output**. Déjalos por defecto.
- Si el código está en un **subcarpeta** del repo (ej. `smile-transformation-platform`), en **Root Directory** pon esa carpeta.

### 3. Variables de entorno (Supabase)

Antes de dar a Deploy, en **Environment Variables** añade:

| Name | Value | Entornos |
|------|--------|----------|
| `SUPABASE_URL` | La Project URL de Supabase | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | La clave service_role de Supabase | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | La misma Project URL | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clave anon public de Supabase | Production, Preview |

Cuando tengas Stripe, añade también:  
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (el webhook secret lo añades después de crear el endpoint en Stripe).

### 4. Deploy

1. **Deploy**.
2. Espera a que termine. Te dará una URL tipo `https://xxx.vercel.app`.
3. Abre esa URL: debe cargar la landing. Prueba también:
   - `https://tu-url.vercel.app/api/health` → debe devolver `{"ok":true,...}`.
   - `https://tu-url.vercel.app/api/health/ready` → 200 si Supabase está bien configurado.

---

## Conectar la app en local (opcional)

Para desarrollar en tu máquina contra el mismo Supabase:

```bash
cd smile-transformation-platform
cp .env.example .env.local
```

Edita `.env.local` y rellena con los mismos valores de Supabase (y Stripe cuando los tengas):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Luego:

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para entrar al admin usa el email y contraseña del usuario que creaste en Supabase.

---

## Comprobar que todo está conectado

Desde la raíz del proyecto:

```bash
cd smile-transformation-platform
./scripts/deploy_verify.sh https://TU-URL-VERCEL.vercel.app
```

(O desde la carpeta padre:  
`./smile-transformation-platform/scripts/deploy_verify.sh https://TU-URL-VERCEL.vercel.app`.)

El script comprueba env, build y endpoints. Si algo falla, revisa las variables en Vercel y que las migraciones estén ejecutadas en Supabase.

---

## Resumen

| Dónde | Qué hacer |
|-------|-----------|
| **Supabase** | New project → SQL Editor (0001…0005 + seed) → crear usuario → asignar admin en `profiles` → copiar URL y anon/service_role |
| **Vercel** | Import repo → añadir variables (Supabase; Stripe después) → Deploy → copiar URL |
| **Local** | `cp .env.example .env.local`, rellenar, `npm run dev` |

Guía detallada (incluye Stripe y troubleshooting): [GUIA_PASO_A_PASO_PRODUCCION.md](GUIA_PASO_A_PASO_PRODUCCION.md).
