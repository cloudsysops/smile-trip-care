# Plan 12 meses + estrategia para primeros 100 pacientes

**Objetivo:** Construir el Airbnb del turismo médico con un plan realista y operativo. Dirección clara para el proyecto y para Cursor (features, arquitectura, prioridades).

**Referencia de producto:** [PRODUCT_VISION.md](PRODUCT_VISION.md).

---

## Plan 12 meses (fases)

### Fase 1 — Validación (0–3 meses)

**Objetivo:** Conseguir los primeros 10–20 pacientes internacionales. No escalar; solo validar.

| Área | Acción | Estado plataforma |
|------|--------|-------------------|
| **Producto mínimo** | Landing, assessment, lead, admin, paquetes, Stripe | ✅ Casi todo listo. |
| **Landing optimizada** | Páginas clave: veneers-colombia, smile-makeover-colombia, dental-tourism-medellin. Cada una: SEO, before/after, precios, CTA → assessment. | Pendiente: landings por keyword. |
| **Red mínima de clínicas** | 3 clínicas fuertes (ej. Medellín, Bogotá, Cali). Oferta: pacientes internacionales, marketing global. Cobro: 15–25% comisión. | Modelo de datos listo (providers, packages); acuerdos comerciales. |
| **Cerrar primeros pacientes** | Flujo: Paciente → assessment → WhatsApp → consulta → depósito. Ventas manuales al inicio. | Flujo técnico listo; cierre humano. |

---

### Fase 2 — Producto fuerte (3–6 meses)

**Objetivo:** Automatizar operaciones.

| Área | Acción | Estado plataforma |
|------|--------|-------------------|
| **AI matching** | Input: procedimiento, budget, country, timeline. Output: best clinic, best doctor, estimated price. Mejora conversión. | Base: triage + recomendación paquete/especialista. Ampliar inputs y mensaje “estimated price”. |
| **Patient portal completo** | Pacientes ven: treatment plan, travel plan, doctor, hotel, timeline. Genera confianza. | ✅ Secciones en `/patient`. Completar contenido y claridad. |
| **Automatización** | Lead → email + WhatsApp + task coordinador. Pago → onboarding + travel planning. | ✅ Workers, outbound; afinar triggers y mensajes. |

---

### Fase 3 — Marketplace (6–12 meses)

**Objetivo:** Convertirse en marketplace global.

| Área | Acción | Estado plataforma |
|------|--------|-------------------|
| **Portal clínicas** | Clínicas publican tratamientos, ven pacientes, gestionan agenda. | Pendiente: capa B2B (autoservicio). |
| **Reviews verificadas** | Pacientes dejan rating, experiencia, resultado. Confianza masiva. | Pendiente: modelo reviews. |
| **Expansión países** | Inicial: Colombia. Luego: México, Costa Rica, Brasil, Turquía. | Multi-país en modelo (providers por país); contenido y clínicas. |

---

## Estrategia para primeros 100 pacientes internacionales

Enfoque: **growth + producto** — SEO, contenido, anuncios y cierre humano.

### 1. Nicho inicial (hiper-enfoque)

- **Recomendado:** Smile makeover / veneers + implantes dentales.
- **Motivo:** Alta demanda en EE.UU., gran diferencia de precio USA–Colombia, resultados visuales que convierten.

### 2. SEO internacional (motor principal)

- **Páginas por keyword:** veneers colombia cost, smile makeover colombia price, dental tourism medellin, hollywood smile colombia.
- **Cada landing:** explicación del procedimiento, precio estimado, fotos antes/después, viaje médico, CTA → Start free assessment.
- **Estructura típica:** Hero (procedimiento + precio) → Before/After → Tratamiento → Ventajas Colombia → Clínicas recomendadas → CTA assessment.

### 3. Contenido que genera confianza

- Historias de pacientes (journeys), videos antes/después, tours de clínicas, entrevistas doctores, proceso completo del viaje.
- Plataformas: YouTube, TikTok, Instagram.
- Formato que convierte: Day 1 consultation, Day 2 procedure, Day 7 results.

### 4. Google Ads

- Campañas: veneers colombia, dental tourism medellin, smile makeover abroad.
- Métricas orientativas: costo por lead $30–100; tasa de cierre 5–10%. Comisión $1000+ por paciente → números viables.

### 5. Proceso de conversión humano

- Flujo: Lead → email automático → WhatsApp → consulta gratuita → recomendación paquete → pago depósito.
- Al inicio: cierre manual. La plataforma ya soporta assessment → lead → admin → recomendación → Stripe.

### 6. Red de clínicas

- Pocas clínicas de alta calidad: certificaciones, experiencia con internacionales, fotos/casos, inglés.
- Acuerdos: comisión 15–25%, precio especial internacionales, cooperación en marketing.

### 7. Automatización progresiva

- Nuevo lead → email + WhatsApp → asignación coordinador → recordatorio consulta.
- Herramientas: CRM interno, flujos automatizados, recordatorios. Base actual: workers + outbound.

---

## Objetivos realistas (primeros meses)

| Período | Leads | Pacientes |
|---------|--------|-----------|
| Mes 1–2 | 30–50 | 3–5 |
| Mes 3–4 | 100 | 10–15 |
| Mes 6 | — | 30–40 / mes |

A partir de ahí el crecimiento se acelera.

---

## Métrica clave

```
Costo por lead
  → Tasa de conversión
  → Ingreso por paciente
```

Ejemplo: lead $60, cierre 1 de cada 20, comisión $1200 → unit economics viables.

---

## Integración con la plataforma actual

El sistema actual soporta este flujo:

```
Landing
  → Assessment
  → Lead en base de datos
  → Admin revisa lead
  → Recomendación de paquete
  → Stripe checkout
  → Paciente confirmado
```

Es suficiente para empezar. Las landings por keyword y el contenido son el siguiente paso de producto/marketing; la tech de core está lista.

---

## Objetivo financiero (referencia)

- Ticket promedio tratamiento: ~$7000. Comisión 20% → ~$1400 por paciente.
- 100 pacientes/mes → ~$140k/mes → ~$1.6M/año.

---

## Uso por Cursor y equipo

- **PRODUCT_VISION.md:** Visión de producto y pilares; guía prioridades de producto y código.
- **Este doc:** Plan por fases (qué construir/cuándo) y estrategia de crecimiento (cómo conseguir los primeros 100 pacientes). Cursor puede alinear features, refactors y documentación con Fase 1 → 2 → 3 y con la estrategia SEO/landings/contenido.

Para plan detallado “primeros 100 pacientes en 90 días” e integración con la plataforma, se puede ampliar en un doc específico (ej. PLAN_90_DIAS_PRIMEROS_100.md) cuando se defina el plan día a día.
