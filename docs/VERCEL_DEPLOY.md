# Conectar GitHub con Vercel

Pasos para enlazar el repo **cloudsysops/smile-transformation-platform-** con Vercel y desplegar en cada push a `main`.

---

## 1. Entrar en Vercel

1. Ve a [vercel.com](https://vercel.com) e **inicia sesión** (o crea cuenta).
2. Si usas GitHub, elige **Continue with GitHub** para que Vercel pueda acceder a tus repos.

---

## 2. Importar el proyecto desde GitHub

1. En el dashboard de Vercel, clic en **Add New…** → **Project**.
2. En **Import Git Repository** deberías ver tus repos de GitHub. Si no:
   - Clic en **Configure GitHub App** o **Adjust GitHub App Permissions**.
   - Autoriza a Vercel el acceso a la organización **cloudsysops** (o a tu usuario) y selecciona al menos el repo **smile-transformation-platform-**.
3. Busca **smile-transformation-platform-** y clic en **Import**.

---

## 3. Configurar el proyecto

Vercel detecta Next.js automáticamente. Revisa:

| Campo | Valor recomendado |
|-------|--------------------|
| **Framework Preset** | Next.js |
| **Root Directory** | `./` (dejar por defecto) |
| **Build Command** | `npm run build` (por defecto) |
| **Output Directory** | `.next` (por defecto) |
| **Install Command** | `npm install` (por defecto) |

No cambies nada salvo que tengas el código en un subdirectorio.

---

## 4. Variables de entorno

Antes de desplegar, añade las variables que usa la app (igual que en `.env.local`):

1. En la misma pantalla de importación, despliega **Environment Variables**.
2. Añade una por una (o pega si Vercel lo permite). Usa el **mismo nombre** que en `.env.example`:

| Variable | Dónde obtenerla | Entornos |
|----------|-----------------|----------|
| `SUPABASE_URL` | Supabase → Project Settings → API | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service_role) | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Igual que SUPABASE_URL | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (anon public) | Production, Preview |

Opcional (cuando tengas Stripe):

| Variable | Entornos |
|----------|----------|
| `STRIPE_SECRET_KEY` | Production (y Preview si quieres probar checkout en preview) |
| `STRIPE_WEBHOOK_SECRET` | Production (y Preview si configuras webhook de preview) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production, Preview |

Opcional (M9 AI):

| Variable | Entornos |
|----------|----------|
| `OPENAI_API_KEY` | Production (y Preview si pruebas AI en preview) |
| `OPENAI_MODEL` | Production, Preview |
| `RATE_LIMIT_PROVIDER` | Production, Preview (`memory` por defecto) |

- Marca **Production** (y **Preview** si quieres que los deploys de PR también tengan env).
- No subas `.env` al repo; solo configúralas en Vercel.

---

## 5. Desplegar

1. Clic en **Deploy**.
2. Vercel clonará el repo, ejecutará `npm install` y `npm run build` y desplegará.
3. Al terminar te dará una URL tipo:  
   `https://smile-transformation-platform-xxxx.vercel.app`  
   (y opcionalmente un dominio custom si lo configuras).

---

## 6. Despliegues automáticos (ya quedan conectados)

Con la conexión GitHub ↔ Vercel:

- **Push a `main`** → despliegue a **Production**.
- **Push a otra rama o PR** → despliegue de **Preview** (URL distinta por rama/PR).

No hace falta hacer nada más; cada push dispara un nuevo deploy.

---

## 7. Webhook de Stripe (cuando lo uses)

Cuando tengas el flujo de pago:

1. En Stripe Dashboard → Developers → Webhooks, crea un endpoint.
2. URL en producción: `https://tu-dominio.vercel.app/api/stripe/webhook`.
3. Copia el **Signing secret** y ponlo en Vercel como `STRIPE_WEBHOOK_SECRET` (solo Production si el webhook es solo para prod).
4. En Stripe, escucha al menos `checkout.session.completed`.
5. Recomendado: configura un endpoint de webhook separado para Preview si harás pruebas en ramas.

---

## 8. Monitoreo y verificación post-deploy

Después de cada deploy a Production:

1. Health checks:
   - `GET /api/health` debe responder `200` con `{ ok: true }`.
   - `GET /api/health/ready` debe responder `200` y `ready: true`.
2. Revisa logs de funciones en Vercel (errores 5xx y p95 de latencia).
3. Ejecuta una prueba de Stripe en modo test y confirma:
   - el webhook devuelve 2xx
   - `payments.status` cambia a `succeeded`
   - `leads.status` cambia a `deposit_paid`.

---

## Resumen

1. [vercel.com](https://vercel.com) → **Add New → Project**.
2. **Import** desde GitHub → elegir **smile-transformation-platform-**.
3. Añadir **Environment Variables** (Supabase y, luego, Stripe).
4. **Deploy** → listo. Los siguientes pushes a `main` desplegarán solos.
5. Verifica health/readiness y webhook de Stripe tras el deploy.

Si algo falla en el build, revisa el **Build Logs** en Vercel (pestaña Deployments → clic en el deploy fallido).
