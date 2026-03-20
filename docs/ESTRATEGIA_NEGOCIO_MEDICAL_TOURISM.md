# Estrategia de negocio — Medical tourism multi-millones

**Objetivo:** Convertir la plataforma en un negocio grande (multi-millones). La clave no es solo tecnología — es **modelo de negocio** y **motor de adquisición de pacientes**.  
**Documento de referencia:** Estrategia en 4 capas (mercado, producto, motor de crecimiento, escalamiento). Alineado con el estado actual de Nebula Smile.

---

## 1. El mercado real (medical tourism)

| Origen (demanda) | Destino (oferta) | Procedimientos más demandados |
|------------------|------------------|-------------------------------|
| 🇺🇸 USA, 🇨🇦 Canadá, 🇬🇧 UK | 🇨🇴 Colombia, 🇲🇽 México, 🇹🇷 Turquía, 🇹🇭 Tailandia | Dental (veneers, smile makeover), cirugía estética, hair transplant, ortopedia, fertilidad |

**Driver:** Precio + calidad.

| Procedimiento   | USA  | Colombia (ej.) |
|-----------------|------|----------------|
| Smile makeover  | $25k | $6k           |
| Implantes       | $8k  | $2k           |
| Hair transplant | $12k | $3k           |

**Oportunidad:** La plataforma gana en la **intermediación**.

---

## 2. Modelo de negocio (marketplace médico curado)

**Flujo:**

```
Paciente internacional
  → Assessment inteligente
  → Matching con clínica
  → Paquete de tratamiento
  → Pago depósito
  → Viaje + tratamiento
  → Comisión plataforma
```

**Fuentes de ingreso típicas:**

| Fuente            | Ejemplo        |
|-------------------|----------------|
| Comisión clínica  | 15–30%         |
| Paquete turismo   | $500–$2.000    |
| Servicios premium | Concierge      |
| Seguro médico     | Afiliación     |

**Ejemplo:** Paciente paga tratamiento $7.000 → comisión 20% → **plataforma $1.400**.  
Con **100 pacientes/mes** → ~**$140k revenue mensual**. Con **600 pacientes/mes** → **$10M+** al año.

---

## 3. Producto ideal (“Airbnb de tratamientos médicos”)

| Componente | Descripción | Estado en Nebula Smile |
|------------|-------------|------------------------|
| **Assessment inteligente** | country, procedure, budget, timeline, medical history → alimenta matching con IA | ✅ Formulario assessment; UTM, referrer, package interest; lead con datos para matching. |
| **Matching con IA** | IA elige best clinic, doctor, city, package (reviews, especialidad, precio, disponibilidad) | ✅ Triage AI, recomendación de paquete y especialista (ciudad + specialties); mejorable con embeddings/reviews. |
| **Paquetes médicos** | Essential / Comfort / Premium con tratamiento, hotel, transporte, recuperación | ✅ essential-care-journey, comfort-recovery-journey, premium-transformation-experience; deposit y flujo checkout. |
| **Portal paciente** | treatment timeline, travel plan, doctor, coordinator, recovery guide | ✅ `/patient`: journey, TreatmentPlanSection, TravelPlanSection, AftercareSection, coordinador, depósito. |

**Conclusión:** El producto actual ya cubre los cuatro componentes; el siguiente paso es **optimizar y validar con pacientes reales**, no rehacer la base.

---

## 4. Motor de crecimiento

| Canal | Acción | Notas |
|-------|--------|--------|
| **SEO internacional** | Páginas por keyword: “veneers Colombia price”, “dental tourism Medellin”, “Hollywood smile Colombia”, “hair transplant Colombia cost” | Landing y packages ya existen; falta contenido SEO por keyword y posible blog/landings por procedimiento/ciudad. |
| **Google Ads** | “veneers Colombia”, “cost veneers abroad”, “smile makeover Medellin”; CPA lead típico $30–$120 | Si cierras 1 venta cada ~20 leads, el unit economics puede funcionar. |
| **YouTube / TikTok** | Before/after, patient journeys, clinic tours, doctor interviews | Contenido y distribución; la plataforma puede enlazar y convertir. |

**Prioridad estratégica:** No construir más tecnología ahora; **validar si los pacientes compran**.

---

## 5. Diferenciador: AI medical advisor

**Idea:** Un asistente que diga, por ejemplo:

> “Based on your assessment, we recommend Dr. Martínez in Medellín. Estimated cost: $6.200. Recovery: 7 days. Success rate: 98%.”

**Estado actual:** Triage y recomendación de paquete/especialista ya existen; thank-you y admin muestran “Recommended package” y “Recommended specialist”. Falta: **mensaje tipo advisor** (frase única, coste estimado, días recuperación, tasa éxito) y opcionalmente **chat** para escalar conversaciones.

---

## 6. Estructura del negocio (Medical Tourism OS)

Servicios que puede ofrecer la plataforma:

- **Marketplace** (clínicas, paquetes, matching) — ✅ Base hecha.
- **Concierge** — Parcial (coordinador, outbound); se puede formalizar como “servicio premium”.
- **Travel** — Incluido en paquetes (transporte, alojamiento); ampliable.
- **Financing** — No en repo; Fase 2.
- **Insurance** — No en repo; Fase 2.

---

## 7. Cómo llegar a $10M (ejemplo)

| Métrica | Valor ejemplo |
|---------|----------------|
| Pacientes/mes | 100 → 600 |
| Ticket promedio | $7.000 |
| Comisión | 20% |
| Revenue por paciente | $1.400 |
| 100 pacientes/mes | $140k/mes ≈ $1,68M/año |
| 600 pacientes/mes | $840k/mes ≈ **$10M+**/año |

La arquitectura actual (leads, packages, payments, portal, automation) **soporta** este volumen; el cuello de botella será **adquisición y cierre**, no la tech en sí.

---

## 8. Ventaja actual (Cristian / Nebula Smile)

Ya tienes:

- Infraestructura cloud (Vercel, Supabase, Stripe).
- Backend sólido (API por dominios, RLS, auth, roles).
- Pagos (checkout, webhook, idempotencia).
- Portal paciente (journey, depósito, coordinador).
- Base de datos (leads, packages, payments, providers, specialists).
- Automatización (cola, workers, outbound).
- IA (triage, recomendación).

La mayoría de startups de medical tourism **no** parten con todo esto. El siguiente paso es **ventas y validación**, no reescribir.

---

## 9. Qué hacer ahora (prioridades)

| # | Prioridad | Acción concreta | Relación con el repo |
|---|-----------|------------------|----------------------|
| 1 | Lanzar landing optimizada | SEO, mensaje claro, CTAs, paquetes visibles | Landing actual; mejorar copy, meta tags, posiblemente landings por keyword. |
| 2 | Captar leads reales | Tráfico (SEO/Ads/social) → assessment → thank-you | Flujo ya existe; medir conversión y costo por lead. |
| 3 | Cerrar 10 pacientes | Admin recomienda paquete → depósito → webhook → deposit_paid | Flujo documentado en TEST_FIRST_SALE.md; ejecutar con pacientes reales. |
| 4 | Mejorar matching | Datos (reviews, disponibilidad) + IA (embeddings, advisor) | Mejora iterativa sobre triage y recomendación actuales. |
| 5 | Automatizar operaciones | Outbound, coordinador, recordatorios | Workers y outbound ya existen; afinar triggers y mensajes. |

**Mensaje clave:** No necesitas construir más tecnología ahora. Necesitas validar: **¿Los pacientes compran?**

---

## 10. Siguiente nivel (si quieres escalar la visión)

Versión “Airbnb de tratamientos médicos” con:

- IA (matching + advisor + chat).
- Marketplace global (múltiples países/destinos).
- Clínicas afiliadas (onboarding, comisiones, reviews).

Eso es evolución sobre la base actual: misma plataforma, más clínicas, más destinos, más contenido y más capas de IA. No implica tirar lo construido.

---

## Resumen

| Eje | Estado | Siguiente paso |
|-----|--------|----------------|
| **Mercado** | Definido (origen/destino/procedimientos) | Enfocar 1–2 procedimientos y 1–2 destinos primero. |
| **Modelo** | Comisión + paquete; flujo claro | Cerrar primeros 10 pacientes y medir LTV/CAC. |
| **Producto** | Assessment, matching, paquetes, portal | Optimizar landing y mensaje “AI advisor”. |
| **Crecimiento** | Canales definidos (SEO, Ads, video) | Lanzar landing, captar leads, medir. |
| **Tech** | Sólida para escalar | Validar ventas; luego embeddings, chat, más destinos. |

Este documento sirve como **referencia de estrategia**; para detalles técnicos y arquitectura, ver [ARQUITECTURA_BLUEPRINT_SERIE_A.md](ARQUITECTURA_BLUEPRINT_SERIE_A.md) y [INFORME_AUDITORIA_DETALLADO.md](INFORME_AUDITORIA_DETALLADO.md).
