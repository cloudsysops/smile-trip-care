# Guía paso a paso — Llevar Nebula Smile a producción

Guía para hacer todo lo que la IA no puede: Supabase, Vercel, Stripe y pruebas. Sigue los pasos en orden.

---

## Qué necesitas antes de empezar

- Cuenta en **GitHub** (y el repo del proyecto subido).
- Cuenta en **Supabase** — [supabase.com](https://supabase.com) → Sign up / Login.
- Cuenta en **Vercel** — [vercel.com](https://vercel.com) → Login with GitHub.
- Cuenta en **Stripe** — [dashboard.stripe.com](https://dashboard.stripe.com) → Login (puedes usar modo Test al principio).

Tiempo estimado: 30–60 minutos la primera vez.

---

## Parte 1 — Supabase (base de datos de producción)

### 1.1 Crear el proyecto

1. Entra en [app.supabase.com](https://app.supabase.com) e inicia sesión.
2. Clic en **"New project"**.
3. **Organization:** elige la que tengas (o crea una).
4. **Name:** por ejemplo `smile-prod`.
5. **Database Password:** inventa una contraseña segura y **guárdala** (la pide solo una vez).
6. **Region:** elige la más cercana a tus usuarios (ej. South America si es Colombia).
7. Clic en **"Create new project"** y espera 1–2 minutos.

### 1.2 Ejecutar las migraciones (crear tablas)

1. En el menú izquierdo, entra en **"SQL Editor"**.
2. Clic en **"New query"**.
3. Abre en tu ordenador el archivo del proyecto:  
   `supabase/migrations/0001_init.sql`  
   Copia **todo** el contenido (Cmd+A, Cmd+C).
4. Pega en el SQL Editor de Supabase y clic en **"Run"** (o Ctrl+Enter). Debe decir "Success".
5. Repite para cada archivo, **en este orden**:
   - `0001_init.sql` (ya hecho)
   - `0002_assets_extended_unified.sql` — abre el archivo, copia todo, pega en una **nueva** query, Run.
   - `0003_m9_ai_admin_connected.sql` — igual, nueva query, Run.
   - `0004_lead_ai_ops.sql` — igual, nueva query, Run.
   - `0005_payments_idempotency.sql` — igual, nueva query, Run (evita pagos duplicados si Stripe reintenta el webhook).
6. Luego el seed de paquetes: abre `scripts/seed_packages.sql`, copia todo, nueva query en Supabase, Run.

Si algo da error, anota el mensaje; suele ser que un archivo anterior no se ejecutó bien.

### 1.3 Crear un usuario admin

1. En el menú izquierdo: **Authentication** → **Users**.
2. Clic en **"Add user"** → **"Create new user"**.
3. **Email:** tu email (ej. admin@tudominio.com).
4. **Password:** una contraseña segura (guárdala para entrar al admin).
5. Clic en **"Create user"**.
6. En la lista de usuarios, haz clic en el que acabas de crear y **copia el UUID** (algo como `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).
7. Ve al **SQL Editor**, nueva query, y ejecuta (sustituye `TU-UUID-AQUI` por el UUID que copiaste):

```sql
insert into public.profiles (id, email, role)
values ('TU-UUID-AQUI', 'admin@tudominio.com', 'admin')
on conflict (id) do update set role = 'admin';
```

8. Run. Debe decir "Success".

### 1.4 Copiar las claves para Vercel

1. En el menú izquierdo: **Project Settings** (icono de engranaje) → **API**.
2. En **Project URL** copia la URL (ej. `https://xxxx.supabase.co`). La usarás como:
   - `SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL` (mismo valor).
3. En **Project API keys**:
   - **anon public:** clic en "Reveal" y copia. Es `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **service_role:** clic en "Reveal" y copia. Es `SUPABASE_SERVICE_ROLE_KEY`.  
   **Importante:** no compartas la service_role; solo en el servidor (Vercel).

Deja esta pestaña abierta o anota los cuatro valores en un sitio seguro.

---

## Parte 2 — Vercel (subir la app a internet)

### 2.1 Conectar el repositorio

1. Entra en [vercel.com](https://vercel.com) e inicia sesión (con GitHub si puedes).
2. Clic en **"Add New…"** → **"Project"**.
3. En **Import Git Repository** busca tu repo (ej. `smile-transformation-platform` o el nombre que tenga).
4. Si no sale, clic en **"Adjust GitHub App Permissions"** y autoriza a Vercel a ver ese repositorio.
5. Cuando veas el repo, clic en **"Import"**.

### 2.2 Configurar el proyecto (sin tocar si no sabes)

En la pantalla de configuración, no cambies **Framework Preset** (Next.js), **Root Directory**, **Build Command** ni **Output Directory**. Déjalos por defecto.

### 2.3 Añadir variables de entorno

En la misma pantalla, despliega la sección **"Environment Variables"**.

Añade **una por una** (Name = nombre exacto, Value = el valor). Marca **Production** en cada una:

| Name | Value (de dónde) |
|------|-------------------|
| `SUPABASE_URL` | La URL de Supabase (Project URL que copiaste) |
| `SUPABASE_SERVICE_ROLE_KEY` | La clave service_role de Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | La misma URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clave anon de Supabase |

**Stripe** (si ya tienes claves; si no, puedes añadirlas después y hacer Redeploy):

| Name | Value (de dónde) |
|------|-------------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret key (sk_...) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Misma página → Publishable key (pk_...) |

**Opcional (si usas AI en prod):**

| Name | Value |
|------|--------|
| `OPENAI_API_KEY` | Tu clave de OpenAI |
| `OPENAI_MODEL` | p. ej. `gpt-4o-mini` |

**No** añadas todavía `STRIPE_WEBHOOK_SECRET`; eso lo haremos después de crear el webhook en Stripe.

### 2.4 Primer deploy

1. Clic en **"Deploy"**.
2. Espera a que termine (1–3 minutos). Si falla, ve al paso "Si el build falla" más abajo.
3. Cuando termine, te mostrará una URL tipo:  
   `https://smile-transformation-platform-xxxx.vercel.app`  
   **Cópiala**; la necesitas para Stripe y para probar.

### 2.5 Comprobar que la web carga

Abre esa URL en el navegador. Deberías ver la landing de Nebula Smile. Si ves error, anota el mensaje.

---

## Parte 3 — Stripe (webhook para los pagos)

### 3.1 Crear el endpoint del webhook

1. Entra en [dashboard.stripe.com](https://dashboard.stripe.com) e inicia sesión.
2. Arriba a la derecha, asegúrate de estar en **modo Test** (para pruebas) o **Live** (para cobrar de verdad).
3. Menú: **Developers** → **Webhooks**.
4. Clic en **"Add an endpoint"**.
5. **Endpoint URL:**  
   `https://TU-URL-VERCEL/api/stripe/webhook`  
   (sustituye TU-URL-VERCEL por la URL que te dio Vercel, por ejemplo `https://smile-transformation-platform-xxxx.vercel.app`).  
   No añadas barra al final.
6. En **"Select events to listen to"**, busca y marca **`checkout.session.completed`**.
7. Clic en **"Add endpoint"**.
8. En la página del nuevo endpoint, en **"Signing secret"**, clic en **"Reveal"** y **copia** el valor (empieza por `whsec_...`). Guárdalo.

### 3.2 Poner el secret en Vercel

1. Vuelve a Vercel → tu proyecto → **Settings** → **Environment Variables**.
2. Añade:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** el `whsec_...` que copiaste de Stripe.
   - **Environment:** Production.
3. Guarda.
4. Ve a **Deployments**, clic en los tres puntos del último deploy → **Redeploy**. Así la app usa la nueva variable.

### 3.3 Probar el webhook

1. En Stripe, en la página del webhook que creaste, clic en **"Send test webhook"**.
2. Elige el evento **`checkout.session.completed`** y envía.
3. Debe aparecer **"200"** en la columna de respuesta. Si sale 4xx o 5xx, revisa que la URL sea exacta y que hayas hecho Redeploy en Vercel después de añadir `STRIPE_WEBHOOK_SECRET`.

---

## Parte 4 — Probar que todo funciona (smoke)

### 4.1 Health

1. En el navegador abre: `https://TU-URL-VERCEL/api/health`  
   Debe cargar un JSON con `"ok": true`.
2. Abre: `https://TU-URL-VERCEL/api/health/ready`  
   Debe cargar un JSON con `"ready": true` (o al menos que responda 200).

### 4.2 Flujo completo (una pasada)

1. Entra en `https://TU-URL-VERCEL` y rellena el formulario de assessment. Envía.
2. Entra como admin: `https://TU-URL-VERCEL/admin/login` con el email y contraseña del usuario que creaste en Supabase.
3. Ve a **Leads** y comprueba que aparece el lead que acabas de crear.
4. Abre ese lead, clic en **"Collect deposit"** (o similar) y completa el pago en Stripe (tarjeta de test: 4242 4242 4242 4242).
5. Vuelve a Stripe → Webhooks y revisa que el último evento tenga respuesta 200.
6. En Supabase → **Table Editor** → `payments`: el pago debe tener `status = succeeded`. En `leads`, el lead debe tener `status = deposit_paid`.

Si todo eso pasa, ya estás en producción y el flujo de pago funciona.

---

## Si algo falla

### El build falla en Vercel

1. Vercel → **Deployments** → clic en el deploy fallido.
2. Revisa el **Build Logs** (errores en rojo). Suele ser: variable de entorno faltante o error de TypeScript.
3. Si falta una variable, añádela en **Settings** → **Environment Variables** y haz **Redeploy**.

### La web carga pero /admin no deja entrar

- Comprueba que en Supabase ejecutaste el `insert into profiles` con el UUID del usuario y `role = 'admin'`.
- Entra con el mismo email y contraseña que creaste en Authentication → Users.

### El webhook de Stripe da 500

- Comprueba que en Vercel está puesta exactamente `STRIPE_WEBHOOK_SECRET` con el valor `whsec_...`.
- Después de añadirla, haz **Redeploy**.
- Comprueba que la URL del webhook es exactamente `https://TU-DOMINIO/api/stripe/webhook` (sin barra final).

### No tengo las claves de Stripe

- Stripe Dashboard → **Developers** → **API keys**. Ahí ves la Publishable key (pk_...) y puedes revelar la Secret key (sk_...). En modo Test son para pruebas; en Live son para cobrar de verdad.

---

## Resumen rápido (orden)

1. **Supabase:** New project → SQL Editor (0001, 0002, 0003, 0004, 0005, seed_packages) → crear usuario → insert en profiles como admin → copiar URL y anon/service_role.
2. **Vercel:** Add New → Project → Import repo → añadir variables (Supabase y Stripe menos webhook secret) → Deploy → copiar URL.
3. **Stripe:** Webhooks → Add endpoint (URL = tu Vercel + `/api/stripe/webhook`, evento `checkout.session.completed`) → copiar signing secret → en Vercel añadir STRIPE_WEBHOOK_SECRET → Redeploy.
4. **Probar:** /api/health, /api/health/ready, assessment, login admin, depósito, comprobar DB.

Cuando todo esté verde, marca el track Deploy como hecho en **STATUS.md** y anota la URL de producción donde la use el equipo.

---

## Checklist final de lanzamiento (8 puntos)

Antes de dar por cerrada la puesta en producción, verifica:

- [ ] **Landing abre** — la página principal carga.
- [ ] **Assessment crea lead** — enviar el formulario y comprobar que aparece un lead (admin o DB).
- [ ] **Admin ve leads** — login en `/admin/login` y listado de leads visible.
- [ ] **Stripe checkout abre** — desde un lead, "Collect deposit" redirige a Stripe.
- [ ] **Webhook responde 200** — en Stripe Dashboard → Webhooks, el evento `checkout.session.completed` tiene respuesta 200.
- [ ] **DB actualiza payment** — tras un pago de prueba, en Supabase la tabla `payments` tiene `status = succeeded` y el lead `status = deposit_paid`.
- [ ] **`/api/health` funciona** — `GET https://tu-dominio/api/health` devuelve 200 y `"status":"ok"`.
- [ ] **`/api/health/ready` funciona** — `GET https://tu-dominio/api/health/ready` devuelve 200 cuando Supabase está configurado.

Si esos 8 puntos funcionan, la plataforma está **realmente en producción**.

### Script de verificación final

En el proyecto tienes un script que comprueba health, ready, status y landing:

```bash
./scripts/verify_production.sh https://tu-dominio.vercel.app
```

Requisito: tener `curl` instalado. Si tienes `jq`, formatea la salida JSON; si no, muestra el JSON en bruto.

### Script de deploy completo (env + build + smoke)

Para comprobar todo en un solo comando antes o después de desplegar:

```bash
./scripts/deploy_verify.sh https://tu-dominio.vercel.app
```

O con un archivo de env concreto:

```bash
ENV_FILE=.env.production ./scripts/deploy_verify.sh https://tu-dominio.vercel.app
```

El script: (1) comprueba que las variables de entorno requeridas estén definidas, (2) ejecuta `npm run verify` (lint, test, build), (3) opcionalmente ejecuta migraciones si tienes Supabase CLI enlazado, (4) hace smoke contra la URL (health, ready, status, landing). No imprime secretos.

---

## Después del lanzamiento (mejoras recomendadas)

No son obligatorias para vender; se pueden añadir cuando el equipo tenga tiempo:

1. **Sentry** — captura de errores en producción.
2. **Vercel Analytics** — tráfico y uso básico.
3. **Monitor de webhooks** — revisar que Stripe siga recibiendo 200 (Dashboard o alertas).
4. **Cola durable para automatizaciones** — si más adelante automatizas envíos o AI, usar una cola (p. ej. Vercel + queue o servicio externo).
5. **Dashboard de métricas** — leads, conversión, ingresos (Supabase + vistas o herramienta externa).
