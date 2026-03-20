# Plan: Smart Intake Wizard (Concierge Lead Capture)

**Clasificación:** SENSITIVE (escritura en `leads`, subida de archivos a Storage, API pública).  
**Objetivo:** Wizard de 4 pasos con motivo, presupuesto, fotos clínicas (drag-and-drop → Supabase Storage) y contacto; mismo flujo de negocio (POST → leads, redirect thank-you).

---

## Alcance acordado

- **Paso 1 (Motivo):** Botones grandes: Implantes, Diseño de Sonrisa, Carillas, Otro → se mapea a `selected_specialties` (un valor) o campo nuevo `intake_reason`.
- **Paso 2 (Presupuesto/Timeline):** Selector de rango (slider o select) → `budget_range` (ya existe).
- **Paso 3 (Evidencia clínica):** Drag-and-drop fotos dentadura → subida a bucket Supabase `patient-photos`, rutas guardadas en el lead.
- **Paso 4 (Contacto):** Nombre, WhatsApp, Email → envío final; loading: "Analizando tu caso para conectarte con el mejor especialista en Medellín...".
- **Estilo:** Tailwind, lucide-react, framer-motion (transiciones laterales). Medical Concierge.
- **Lógica:** Al completar → llamar a `/api/leads`; insertar lead (incluyendo fotos); redirect thank-you.

---

## Dependencias nuevas

| Paquete        | Uso                    |
|----------------|------------------------|
| `framer-motion` | Transiciones entre pasos |
| `lucide-react`  | Íconos (especialidad, presupuesto, fotos, contacto) |

---

## Cambios técnicos

### 1. Base de datos y Storage

- **Migración 0021:**
  - Añadir a `leads`: `patient_photo_paths text[] default '{}'` (rutas en bucket `patient-photos`).
  - Opcional: `intake_reason text` si se prefiere no reutilizar `selected_specialties` para el botón único del paso 1.
- **Bucket Supabase:** `patient-photos` (crear en Dashboard o vía política; solo servicio/server escribe). RLS: acceso solo vía service role para uploads; lectura para admin.

### 2. API

- **POST /api/leads** debe aceptar **multipart/form-data** además de JSON:
  - Campo `data`: string JSON con los campos actuales del lead (first_name, last_name, email, phone, country, budget_range, selected_specialties o intake_reason, UTM, landing_path, honeypot, etc.).
  - Campo `photos` (o `photos[]`): archivos de imagen (máx. 5–10; tipo image/jpeg, image/png; tamaño máx. ej. 5 MB cada uno).
- **Flujo en servidor:** validar JSON → honeypot + rate limit → insert lead (sin fotos) → para cada file: subir a `patient-photos/{lead_id}/{uuid}.{ext}` → actualizar lead con `patient_photo_paths` → enqueue automation → 201 con lead_id y recommended_package_slug.
- **Validación de archivos:** tipo MIME, extensión, tamaño; rechazar resto con 400.

### 3. Validación (Zod / lead)

- `LeadCreateSchema`: sin cambio para el cuerpo JSON (fotos no van en JSON; van en multipart).
- Añadir en servidor validación de `patient_photo_paths` solo si se recibe por JSON (ruta alternativa); en el flujo principal las rutas las genera el servidor tras subir.

### 4. Frontend (Wizard)

- **Componente:** `SmartIntakeWizard.tsx` en `app/assessment/` (o `components/assessment/`), usado desde `app/assessment/page.tsx` en lugar de (o envolviendo) el formulario actual.
- **Estado local:** paso actual (1–4), motivo, presupuesto, lista de archivos (File[]), datos de contacto.
- **Paso 4 submit:** construir `FormData`: append `data` (JSON con first_name, last_name, email, phone, country, budget_range, selected_specialties o intake_reason, landing_path, referrer, UTM, company_website); append cada archivo como `photos` o `photos[]`. `fetch("/api/leads", { method: "POST", body: formData })` (sin `Content-Type` para que el browser ponga boundary).
- **Loading:** mensaje "Analizando tu caso para conectarte con el mejor especialista en Medellín...".
- **Tras 201:** redirect a `/thank-you?lead_id=...&recommended_package_slug=...` como hoy.
- **Accesibilidad:** labels, focus, aria-live para errores.

### 5. Archivos a tocar

| Archivo | Cambio |
|--------|--------|
| `package.json` | Añadir framer-motion, lucide-react |
| `supabase/migrations/0021_leads_patient_photos.sql` | Nueva columna + comentario; bucket se crea en Dashboard o en migración si Supabase lo permite |
| `lib/validation/lead.ts` | Opcional: intake_reason si no reutilizamos selected_specialties |
| `app/api/leads/route.ts` | Aceptar multipart; parsear `data` + `photos`; upload a Storage; update lead con patient_photo_paths |
| `app/assessment/AssessmentForm.tsx` | Sustituir por wizard o importar SmartIntakeWizard y mantener AssessmentForm como fallback (recomendado: nuevo SmartIntakeWizard y page usa solo el wizard) |
| `app/assessment/page.tsx` | Renderizar SmartIntakeWizard con packages y prefillPackageSlug |
| `docs/PLAN_SMART_INTAKE_WIZARD.md` | Este plan |

### 6. Admin (fuera de este plan)

- Vista admin para **previsualizar fotos del paciente** en el detalle del lead: se puede hacer en un siguiente paso (nuevo prompt/tarea). Este plan se centra en el flujo de captación (assessment) y en que las rutas queden guardadas en el lead.

---

## Riesgos y mitigación

| Riesgo | Mitigación |
|--------|-------------|
| Abuso de subida (tamaño/número) | Límite por request (ej. 5 archivos, 5 MB c/u); rate limit ya existe en /api/leads. |
| Tipos de archivo | Solo image/jpeg, image/png; validación en servidor. |
| Bucket público | Bucket privado; URLs firmadas para que admin vea fotos en detalle del lead (fase siguiente). |
| Regresión del flujo actual | Mantener contrato 201 + lead_id + redirect; tests de integración para POST /api/leads (JSON y multipart con 0 fotos). |

---

## Orden de implementación sugerido

1. Migración 0021 + crear bucket `patient-photos` (Dashboard si hace falta).  
2. Añadir framer-motion y lucide-react; verificar build.  
3. Extender POST /api/leads para multipart (data + photos), upload y update de patient_photo_paths.  
4. Implementar SmartIntakeWizard (4 pasos, estado, FormData en paso 4).  
5. Conectar assessment page al wizard.  
6. Tests: al menos un test que envíe multipart con 0 fotos y compruebe 201 y lead creado; opcional 1 foto.  
7. Actualizar docs (DATA_MODEL, TEST_FIRST_SALE si aplica).

---

*Documento de plan — implementación tras aprobación explícita del founder.*
