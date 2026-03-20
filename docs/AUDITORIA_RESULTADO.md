# Resultado auditoría — Buenas prácticas

**Fecha:** 2026-03-07  
**Alcance:** Seguridad (S1–S5), Validación (V1–V2), Documentación (D3). Solo lectura; sin cambios en código.

---

## 1. API routes: públicas vs protegidas

**Rutas bajo `app/api` (y subdirs) encontradas:**

| Ruta | Método | Protección | Notas |
|------|--------|------------|--------|
| `app/api/leads/route.ts` | POST | **Pública (intencional)** | Rate limit por IP (10/min). Validación Zod + honeypot. |
| `app/api/stripe/webhook/route.ts` | POST | **Protegida (firma Stripe)** | Requiere header `stripe-signature`; payload validado con `STRIPE_WEBHOOK_SECRET` antes de procesar. |

**Nota:** No existen en el repo rutas para `/api/health`, `/api/health/ready` ni `/api/status`. Solo hay estas dos rutas API. El resto de endpoints mencionados en la auditoría no están implementados en `app/api`.

---

## 2. Rate limit y comprobación de secrets

**Rate limiting (S2):**
- **Sí.** POST `/api/leads` usa `checkRateLimit(ip)` desde `@/lib/rate-limit`.
- Configuración en `lib/rate-limit.ts`: ventana 60_000 ms, máximo 10 peticiones por ventana por clave (IP).
- Proveedor por defecto: en memoria (`lib/rate-limit/provider.ts`); documentar en README/ENV si se usa otro en producción.

**Secrets (S3):**
- **Ningún secreto hardcodeado encontrado.** Búsqueda de `sk_`, `STRIPE_SECRET`, `SUPABASE_SERVICE`, `api_key` en código:
  - Solo aparecen **nombres de variables de entorno** (p. ej. `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) en comprobaciones de configuración en `lib/` y `app/api/stripe/webhook/route.ts`.
  - No hay literales con claves reales en el código.

---

## 3. Webhook Stripe: validación de firma (S4)

**Confirmado.** En `app/api/stripe/webhook/route.ts`:
- Se exige header `stripe-signature`; si falta → 400.
- El body se lee como texto crudo (`request.text()`) para verificación.
- Se llama a `Stripe.webhooks.constructEvent(payload, signature, config.STRIPE_WEBHOOK_SECRET)` antes de cualquier lógica de negocio.
- Si la firma es inválida → 400 "Invalid signature"; no se procesa el evento.
- El procesamiento de `checkout.session.completed` y las actualizaciones a `payments`, `leads` y `bookings` ocurren solo después de una firma válida.

---

## 4. RLS en migraciones Supabase (S5)

**Migraciones revisadas:** `0006`, `0007`, `0008`, `0009` (son las únicas presentes en `supabase/migrations/`).

**Tablas con RLS definido en este repo:**

| Tabla | SELECT | INSERT | UPDATE | DELETE | Notas |
|-------|--------|--------|--------|--------|--------|
| **specialists** | Público si `published = true` | Solo admin | Solo admin | Solo admin | `specialists_public_select`, `specialists_admin_all` |
| **experiences** | Público si `published = true` | Solo admin | Solo admin | Solo admin | `experiences_public_select`, `experiences_admin_all` |
| **consultations** | Solo admin | Solo admin | Solo admin | Solo admin | `consultations_admin_all` |
| **providers** | Público (`using (true)`) | Solo admin | Solo admin | Solo admin | `providers_public_select`, `providers_admin_all` |
| **bookings** | Solo admin | Solo admin | Solo admin | Solo admin | `bookings_admin_all` |

**Tablas no definidas en estas migraciones:** `profiles`, `leads`, `packages`, `payments`. Se referencian (p. ej. en FKs o comentarios) pero su creación y políticas RLS no están en los archivos de migración de este repositorio. **No se pudo verificar RLS para profiles, leads, packages ni payments** desde este repo.

---

## 5. Validación (V1–V2)

**V1 – Leads API y Zod:**
- **Sí.** `app/api/leads/route.ts` usa `LeadCreateSchema` de `@/lib/validation/lead` con `safeParse(body)`.
- Los campos enviados a Supabase son solo los de `parsed.data` (definidos en el schema: `first_name`, `last_name`, `email`, `phone`, `country`, `package_slug`, `message`, `specialist_ids`, `experience_ids`; honeypot `company_website` no se persiste).
- El schema **no** usa `.strict()`: Zod elimina por defecto claves no definidas, por lo que los campos extra no se insertan en BD. Si se quisiera rechazar peticiones con campos extra, habría que añadir `.strict()` al schema.

**V2 – IDs en URLs dinámicas:**
- Ruta dinámica con `[id]`: `app/admin/leads/[id]/page.tsx`.
- **No se valida que `id` sea UUID** antes de la consulta a Supabase. Se usa `const { id } = await params` y luego `.eq("id", id)`. Si se pasa un valor no UUID, el comportamiento depende de Supabase (p. ej. ningún fila).
- Existe `RouteIdParamSchema` en `lib/validation/common.ts` con `id: UuidSchema`, pero **no se usa** en esta página. Recomendación: validar `id` con ese schema (o equivalente) antes de llamar a Supabase y devolver 404 si no es UUID válido.

---

## 6. TODO / FIXME / HACK (D3)

Búsqueda en `app/`, `lib/` y `app/api/` (archivos `.ts`, `.tsx`, `.js`, `.jsx`):

**No se encontraron ocurrencias de TODO, FIXME ni HACK.**

---

## Resumen de tareas marcadas

| Tarea | Estado |
|-------|--------|
| S1 – API públicas vs protegidas | [x] Revisado; solo 2 rutas; leads pública, webhook por firma. |
| S2 – Rate limiting en POST /api/leads | [x] Confirmado (10/min por IP). |
| S3 – Secrets en código | [x] Ningún secreto hardcodeado. |
| S4 – Firma webhook Stripe | [x] Validación antes de procesar. |
| S5 – RLS | [x] Verificado en migraciones 0006–0009 para specialists, experiences, consultations, providers, bookings. No verificable para profiles, leads, packages, payments (no están en migraciones del repo). |
| V1 – Leads con Zod | [x] Schema usado; no se aceptan campos extra en la inserción. |
| V2 – IDs en rutas [id] | [x] Revisado; admin/leads/[id] no valida UUID (recomendación: usar RouteIdParamSchema). |
| D3 – TODOs/FIXMEs | [x] Ninguno encontrado. |
