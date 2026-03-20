# Arquitectura blueprint — nivel startup / Serie A

**Plataforma:** Smile Transformation Platform / Nebula Smile  
**Objetivo:** Empezar simple ahora y escalar sin reescribir todo.  
**Referencia:** Documento de arquitectura recibido (Cristian); alineado con estado actual del repo.

---

## 1. Capa de frontend (experiencia de usuario)

**Stack:** Next.js 16, React 19, Tailwind CSS, Vercel.

| Área | Blueprint | Estado actual en repo |
|------|-----------|------------------------|
| **Público** | `/`, `/packages`, `/assessment`, `/about`, `/contact` | ✅ `/`, `/packages`, `/packages/[slug]`, `/assessment`, `/thank-you`, `/legal`, `/login`, `/signin`, `/signup`. ⚠️ No `/about` ni `/contact` dedicados (pueden vivir en landing o legal). |
| **Portal paciente** | `/patient`, `/patient/treatment-plan`, `/patient/travel`, `/patient/recovery` | ✅ `/patient` (dashboard con journey, deposit, submissions). Las subrutas treatment-plan / travel / recovery están como **secciones dentro de la misma página** (TreatmentPlanSection, TravelPlanSection, AftercareSection). |
| **Portal interno** | `/admin`, `/admin/leads`, `/admin/payments`, `/admin/recommendations` | ✅ `/admin` (overview), `/admin/leads`, `/admin/leads/[id]` (con recomendación de paquete), `/admin/outbound`, `/admin/status`, etc. Pagos: flujo “Collect deposit” en lead detail; métricas en `/admin` o integradas. |
| **Portal médicos** | `/specialist`, `/provider`, `/coordinator` | ✅ `/specialist`, `/provider`, `/coordinator` (con guards por rol). |

**Conclusión:** Frontend alineado con el blueprint; diferencias menores (about/contact, subrutas paciente como secciones en una sola página).

---

## 2. Capa API (backend modular por dominios)

**Blueprint sugerido:** `/api/health`, `/api/auth`, `/api/leads`, `/api/packages`, `/api/recommendations`, `/api/payments`, `/api/stripe`, `/api/automation`, `/api/ai`, `/api/admin`.

| Dominio | Blueprint | Estado actual |
|---------|-----------|----------------|
| **health** | `/api/health` | ✅ `/api/health`, `/api/health/ready`. |
| **auth** | `/api/auth` | ✅ `/api/auth/me`, `/api/auth/signout`; signup en `/api/signup`. |
| **leads** | `/api/leads`, create/update/recommend | ✅ `/api/leads` (POST create); actualización y recomendación en **admin**: `/api/admin/leads`, `/api/admin/leads/[id]` (PUT/PATCH, recomendación en body). |
| **packages** | `/api/packages` | ✅ Paquetes servidos por Server Components y `lib/packages`; admin: `/api/admin/packages/[id]`. No hay `/api/packages` público REST; es intencional (datos desde servidor). |
| **recommendations** | `/api/recommendations` | ✅ Lógica en admin lead detail (recommended_package_slug); AI triage en `/api/admin/ai/triage`. No existe ruta literal `/api/recommendations`; la recomendación es parte del flujo de leads/admin. |
| **payments** | `/api/payments` | ✅ Stripe checkout en `/api/stripe/checkout`; métricas en `/api/admin/payments/metrics`. Webhook actualiza pagos y estado del lead. |
| **stripe** | `/api/stripe` | ✅ `/api/stripe/checkout`, `/api/stripe/webhook`. |
| **automation** | `/api/automation` | ✅ `/api/automation/worker`, `/api/automation/outbound-worker`, `/api/automation/followups`, `/api/automation/payments-reconcile`. |
| **ai** | `/api/ai` | ✅ `/api/ai/triage`, `/api/ai/respond`, `/api/ai/itinerary`; variantes admin en `/api/admin/ai/*`. |
| **admin** | `/api/admin` | ✅ Leads, bookings, consultations, providers, specialists, experiences, assets, outbound, status, payments/metrics. |

**Conclusión:** API ya es modular por dominios; la estructura no sigue exactamente subrutas tipo `/api/leads/create` pero el **dominio** (leads, payments, stripe, automation, ai, admin) está cubierto. Escalar hacia rutas más REST-style (p. ej. `/api/leads/update`, `/api/recommendations`) es evolución natural sin reescribir.

---

## 3. Capa base de datos (Supabase / PostgreSQL)

**Blueprint:** leads, packages, payments, users (roles).

| Entidad | Blueprint | Estado actual (migraciones) |
|---------|-----------|-----------------------------|
| **Leads** | id, name, email, country, assessment_data, recommended_package, status, created_at | ✅ `leads`: id, first_name, last_name, email, phone, country, package_slug, message, status, created_at, UTM/referrer, package_id, recommended_package_id, recommended_package_slug, selected_specialties, etc. |
| **Packages** | ej. essential-care-journey, comfort-recovery-journey, premium-transformation-experience | ✅ `packages` con slug, name, location, recovery_city, duration_days, deposit_cents, published, provider_id, type, price_cents, badge, etc. |
| **Payments** | lead_id, stripe_session_id, amount, status, paid_at | ✅ `payments`: lead_id, stripe_payment_intent_id, stripe_checkout_session_id, amount_cents, status, created_at; webhook actualiza lead a deposit_paid. |
| **Users / roles** | patient, admin, specialist, coordinator | ✅ `profiles` (auth.users): role (user/admin), provider_id, specialist_id; dashboards por rol. |

Además el modelo actual incluye: providers, specialists, experiences, package_specialists, package_experiences, bookings, consultations, outbound_messages, ai_automation_jobs, assets, lead_ai. **Conclusión:** Base de datos alineada y más rica que el mínimo del blueprint.

---

## 4. Capa de pagos (Stripe)

**Flujo blueprint:** Admin recomienda paquete → Crear Stripe Checkout → Cliente paga depósito → Webhook → Actualizar DB → lead.status = deposit_paid.

| Paso | Estado actual |
|------|----------------|
| Admin recomienda paquete | ✅ Lead detail: recomendación de paquete (slug); deposit amount desde package. |
| Crear Stripe Checkout | ✅ `/api/stripe/checkout` (session con amount server-side desde package). |
| Cliente paga depósito | ✅ Redirect a Stripe Checkout; test card 4242... |
| Webhook Stripe | ✅ `/api/stripe/webhook`; evento `checkout.session.completed`; validación de paid state. |
| Actualizar DB | ✅ payments insert/update; lead.status = deposit_paid (idempotencia documentada). |

**Eventos:** Hoy se usa `checkout.session.completed`; `payment_intent.succeeded` se puede añadir si se necesita granularidad extra. **Conclusión:** Flujo completo implementado.

---

## 5. Automatización

**Blueprint:** n8n / Zapier; ejemplos: nuevo lead → email, tarea, WhatsApp; depósito pagado → carpeta paciente, onboarding, asignar coordinador.

| Área | Estado actual |
|------|----------------|
| Cola y workers | ✅ `ai_automation_jobs`, worker en `/api/automation/worker`; outbound en `/api/automation/outbound-worker`. |
| Triggers | ✅ Lead created → triage/respond; deposit_paid → itinerary/ops; follow-ups 24h/48h. |
| Outbound | ✅ Admin outbound queue; envío por proveedores (email/WhatsApp); estado y reintentos. |
| n8n / Zapier | ⚠️ No integrado. Los flujos están en código (Next.js API + Supabase). Para “arrastrar y soltar” más tarde se puede exponer webhooks o conectar n8n a Supabase/Stripe. |

**Conclusión:** Automatización en código lista; integración con n8n/Zapier es Fase 2 si se desea.

---

## 6. Capa de IA

**Blueprint:** Matching médico (assessment → doctor, package, precio); chat asistente (packages, clinic, travel). Tecnología: OpenAI API, embeddings, vector search.

| Capacidad | Estado actual |
|-----------|----------------|
| Matching / recomendación | ✅ AI triage (ciudad, tipo tratamiento); recomendación de paquete en thank-you y admin; `getRecommendedSpecialist` por ciudad y specialties. |
| OpenAI | ✅ Uso de OpenAI en triage, respond, itinerary; esquemas Zod; `OPENAI_API_KEY`, `OPENAI_MODEL`. |
| Embeddings / vector search | ⚠️ No en repo. Fase 2: embeddings de packages/doctors y búsqueda vectorial para matching más fino. |
| Chat asistente | ⚠️ No en repo. Fase 2: chat que use packages + datos de clínica + viaje. |

**Conclusión:** IA operativa para triage y recomendación; embeddings y chat son evolución natural.

---

## 7. Analytics

**Blueprint:** PostHog, Metabase; métricas: leads/día, conversion rate, deposit rate, avg revenue per lead, top country, top treatment.

| Área | Estado actual |
|------|----------------|
| Métricas en app | ✅ Admin overview; métricas de pagos y outbound en admin. |
| PostHog / Metabase | ⚠️ No integrado. Queries contra Supabase (leads, payments, packages) pueden alimentar Metabase o un warehouse más adelante. |

**Conclusión:** Datos en DB listos para conectar analytics (Fase 2).

---

## 8. Seguridad

**Blueprint:** RLS, JWT auth, role-based access, server-side secrets, headers.

| Ítem | Estado actual |
|------|----------------|
| RLS | ✅ Políticas en migraciones (packages, leads, payments, assets, providers, specialists, etc.). |
| Auth | ✅ Supabase Auth (JWT); sesión en servidor; guards por rol. |
| RBAC | ✅ Dashboards y API admin protegidos por rol. |
| Secretos | ✅ Server-side only; `getServerConfigSafe()`; webhook Stripe por firma. |
| Headers | ✅ X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (next.config.ts). |

**Conclusión:** Alineado con el blueprint.

---

## 9. Infraestructura

**Blueprint:** Vercel → Next.js API → Supabase → Stripe → Automation → AI. Escalable hasta ~100k usuarios; luego opcional: API server, worker queue, AI service separados.

| Capa | Estado actual |
|------|----------------|
| Vercel | ✅ Deploy desde Git; Production (main) y Preview (otras ramas) documentados. |
| Next.js API | ✅ Todas las rutas en App Router (API routes). |
| Supabase | ✅ Postgres + Auth; migraciones y seeds documentados. |
| Stripe | ✅ Checkout + webhook. |
| Workers | ✅ Automation y outbound como API routes (cron/trigger); luego se pueden mover a cola externa si crece. |

**Conclusión:** Arquitectura actual coherente con el diagrama y escalable en fases.

---

## 10. Roadmap (alineado al blueprint)

| Fase | Blueprint | Estado |
|------|-----------|--------|
| **Fase 1** | Flujo lead → pago, paquetes, admin panel | ✅ Hecho: assessment, leads, recomendación, checkout, webhook, admin, patient portal básico. |
| **Fase 2** | Matching médico IA, WhatsApp automation, patient portal completo | 🔶 Parcial: matching y recomendación IA; outbound (email/WhatsApp); patient con journey. Pendiente: más subrutas paciente, integración n8n si se desea. |
| **Fase 3** | Marketplace clínicas, reviews, pricing dinámico | ⏳ Futuro: modelo de datos ya tiene providers, packages, experiences; falta marketplace público, reviews y precios dinámicos. |

---

## Resumen ejecutivo

- La plataforma **ya cumple** la mayor parte del blueprint de nivel startup/Serie A: frontend por portales, API por dominios, DB con leads/packages/payments/roles, Stripe completo, automatización en código, IA para triage/recomendación, seguridad (RLS, auth, headers).
- **Diferencias menores:** rutas literal como `/api/recommendations` o `/api/leads/update` (la lógica existe en admin/leads); subrutas paciente como secciones en una página; no `/about` ni `/contact` dedicados.
- **Fase 2 natural:** embeddings + vector search para matching, chat asistente, PostHog/Metabase, opcional n8n/Zapier.
- **Fase 3:** Marketplace, reviews, pricing dinámico sobre el modelo actual.

No hace falta reescribir; la base está lista para escalar y para el siguiente paso estratégico (negocio $10M+ con medical tourism + IA) que quieras explorar.

---

*Documento de referencia; no sustituye a ENVIRONMENTS.md, DEPLOYMENT_STRATEGY.md ni al informe de auditoría.*
