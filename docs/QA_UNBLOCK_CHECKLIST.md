# Checklist: desbloquear QA (assessment + auth)

**Objetivo:** Cerrar los dos bloqueos reales (DB desalineada + deploy) y verificar flujos en ~20 min.

---

## Estado actual

- **Fix de build (SupabaseClient):** Ya aplicado en `lib/supabase/browser.ts` y pusheado a `main`. Vercel debe estar desplegando.
- **Columna `landing_path`:** La migración existe (`0004_leads_attribution.sql`). Hay que aplicarla en el proyecto Supabase que usa el host de QA.

---

## 8 pasos (orden recomendado)

### 1. Confirmar deploy en Vercel
- Vercel → Deployments → último deploy de `main`.
- Estado **Ready** (build exitoso). Si falla, revisar logs (el error de `SupabaseClient` ya está corregido en código).

### 2. Verificar variables de entorno en Vercel
En el proyecto de Vercel, para el entorno que usa QA (Production o Preview), deben existir:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`  
Si faltan o cambias algo → **Redeploy** después.

### 3. Aplicar migración de atribución en Supabase (QA)
El error `PGRST204: Could not find the 'landing_path' column` se resuelve aplicando la migración que agrega esas columnas a `public.leads`.

**Opción A — CLI (si apunta al proyecto correcto):**
```bash
npm run db:migrate
# o
supabase db push
```

**Opción B — Manual en Supabase SQL Editor:**  
Abrir el proyecto Supabase que usa el host de QA → SQL Editor → ejecutar:

```sql
-- Migración 0004_leads_attribution (atribución)
alter table public.leads add column if not exists utm_source text;
alter table public.leads add column if not exists utm_medium text;
alter table public.leads add column if not exists utm_campaign text;
alter table public.leads add column if not exists utm_term text;
alter table public.leads add column if not exists utm_content text;
alter table public.leads add column if not exists landing_path text;
alter table public.leads add column if not exists referrer_url text;

create index if not exists idx_leads_utm_source on public.leads(utm_source) where utm_source is not null;
create index if not exists idx_leads_utm_campaign on public.leads(utm_campaign) where utm_campaign is not null;
```

### 4. Redeploy en Vercel (si cambiaste env)
Si en el paso 2 agregaste o modificaste variables → **Redeploy** desde Vercel para que el build use las nuevas.

### 5. Probar assessment
- Ir a `https://<tu-qa-host>/assessment`.
- Completar y enviar. No debe aparecer error de `landing_path` ni 500.

### 6. Probar auth/me
- En la misma pestaña (o después de login): abrir o hacer una petición a `https://<tu-qa-host>/api/auth/me`.
- Con sesión: debe devolver `role` y `redirectPath`. Sin sesión: 401 es esperado.

### 7. Probar login
- Ir a `https://<tu-qa-host>/login`.
- Iniciar sesión (email/contraseña o Google). No debe quedar en loop; debe redirigir al dashboard según rol.

### 8. Probar patient
- Tras login como paciente: ir a `https://<tu-qa-host>/patient`.
- La página debe cargar como dashboard, no como login.

---

## Resumen de bloqueos

| Bloqueo | Causa | Qué hacer |
|--------|--------|-----------|
| Assessment falla (PGRST204) | Columna `landing_path` (y otras de atribución) no existen en `public.leads` en QA | Aplicar migración 0004 (paso 3). |
| Deploy roto / auth en deploy viejo | Build fallaba por import de `SupabaseClient` desde `@supabase/ssr` | Ya corregido en código; confirmar deploy Ready (paso 1). |
| /api/auth/me Unauthorized en QA | Deploy viejo o env vars faltantes | Pasos 1, 2 y 4; luego 6–8. |

---

## Comandos útiles (local)

```bash
# Supabase instalado
which supabase
supabase --version

# Limpiar lock de Next si el build local falla por eso
rm -f .next/lock
npm run verify
```

No instalar `@vercel/analytics` ni reinstalar Supabase por npm si ya está en el sistema; priorizar cerrar assessment y auth.
