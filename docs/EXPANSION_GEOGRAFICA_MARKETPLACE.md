# Expansión geográfica del marketplace — Modelo estructurado

**Objetivo:** Abarcar más ciudades (y después países) de forma **estructurada y escalable**, no con páginas sueltas. Este documento define el modelo que usan marketplaces grandes para que Cursor y el equipo puedan implementarlo de forma coherente.

---

## 1. Estrategia: hub + ciudades satélite

### Hub inicial recomendado

**Medellín**

- Turismo médico fuerte  
- Clínicas de alto nivel  
- Buena infraestructura  
- Vuelos internacionales  

### Ciudades satélite (Colombia)

Después del hub se agregan:

- Bogotá  
- Cali  
- Cartagena  
- Barranquilla  
- Manizales  

Cada ciudad puede tener **especialidades distintas**.

| Ciudad     | Ejemplo de especialidad      |
|------------|------------------------------|
| Medellín   | Dental / estética            |
| Bogotá     | Ortopedia / cirugía           |
| Cali       | Estética                     |
| Cartagena  | Recuperación / wellness      |

---

## 2. Arquitectura de URLs (marketplace por ciudades)

La plataforma debe estructurarse así para **SEO y escalabilidad**:

### Rutas de ciudades

```
/cities
   /medellin
   /bogota
   /cali
   /cartagena
```

### Rutas SEO por ciudad + procedimiento

Ejemplos:

- `/dental-tourism-medellin`  
- `/veneers-medellin`  
- `/veneers-bogota`  
- `/veneers-cali`  
- `/smile-makeover-medellin`  

**Patrón:** `/[procedimiento]-[city-slug]` o `/[category]-[city-slug]`.

Cada URL = landing con: precios, clínicas recomendadas, fotos, proceso de viaje, CTA → assessment (con ciudad/procedimiento predefinidos).

---

## 3. Estructura de base de datos (objetivo)

### Tabla `cities` (nueva, cuando se implemente expansión)

Ejemplo de modelo:

```sql
cities
------
id           uuid primary key
slug         text not null unique   -- medellin, bogota, cali
name         text not null         -- Medellín
country_id   uuid references countries(id)  -- opcional si hay tabla countries
airport_code text                  -- MDE
description  text
meta_title   text
meta_description text
published    boolean default true
created_at   timestamptz
updated_at   timestamptz
```

### Tabla `clinics` (o uso de `providers` actual)

Hoy la plataforma usa **`providers`** (clínicas/operadores) con `city` (texto). Para escalar:

- **Opción A:** Añadir `city_id` (FK a `cities`) a `providers` y mantener `city` como denormalizado para compatibilidad.  
- **Opción B:** Introducir tabla `clinics` con `city_id` y relacionar con `providers` si el modelo de negocio separa “clínica” de “operador”.

Ejemplo de modelo **clinics** (si se crea como capa nueva):

```sql
clinics
------
id                      uuid primary key
name                    text not null
city_id                 uuid references cities(id)
provider_id             uuid references providers(id)  -- si aplica
specialties             text[]  -- dental, aesthetic, etc.
rating                  numeric
international_patients  boolean default true
published               boolean default true
```

**Estado actual:** `providers` tiene `city` (text), `packages` tiene `location` y `recovery_city`. No hay tabla `cities` ni `country`. La expansión geográfica implica **añadir `cities`** y, opcionalmente, `countries`, y asociar providers/packages a `city_id`.

---

## 4. Paquetes dinámicos por ciudad

**Hoy:** Paquetes fijos (Essential Care Journey, Comfort Recovery Journey, Premium Transformation Experience) con `location` / `recovery_city` en texto (ej. Medellín, Manizales).

**Futuro:** Paquetes pueden **variar por ciudad** o tener una “plantilla” por tipo y una instancia por ciudad.

Ejemplos:

- Comfort Recovery Journey **Medellín**  
- Comfort Recovery Journey **Bogotá**  
- Veneers Package **Cali**  

Implementación posible:

- Añadir `city_id` (o `origin_city_id`) a `packages`, **o**
- Mantener `location`/`origin_city` y derivar la ciudad desde el provider (cuyo `city_id` apunte a `cities`).

---

## 5. Páginas SEO por ciudad

Cada ciudad + procedimiento (o categoría) tiene al menos una página.

**Contenido por página:**

- Precios (USA vs ciudad destino)  
- Clínicas recomendadas en esa ciudad  
- Fotos / antes y después  
- Proceso de viaje (llegada, consulta, tratamiento, recuperación)  
- CTA: **Start Free Assessment** (con ciudad/procedimiento en contexto para el matching)  

Esto genera tráfico orgánico por búsquedas tipo “veneers medellin”, “dental tourism bogota”, etc.

---

## 6. Embudo por ciudad (mismo flujo, contexto geográfico)

El flujo no cambia; solo el **origen** del lead (qué landing/ciudad) y el **matching** (qué ciudad/clínica recomendar):

```
Landing ciudad (ej. /veneers-medellin)
  → Assessment (con ciudad/procedimiento predefinidos o seleccionados)
  → Lead
  → Matching clínica (por ciudad + procedimiento + presupuesto)
  → Paquete
  → Pago
```

La plataforma actual ya hace assessment → lead → recomendación → Stripe. La expansión añade **filtro por ciudad** en el matching y landings por ciudad.

---

## 7. Escala internacional (países)

Cuando Colombia funcione, se agregan **países**:

- México  
- Costa Rica  
- Brasil  
- Turquía  
- Tailandia  

### Estructura de URLs por país

```
/countries
   /colombia
   /mexico
   /turkey
```

Y por país + ciudad:

- `/countries/colombia/cities/medellin`  
- `/veneers-medellin` (si el dominio es global o se usa subdominio por país)  

Cada país tiene sus ciudades; la tabla `cities` tendría `country_id` (tabla `countries` con slug, name, etc.).

---

## 8. Matching inteligente (objetivo)

Con assessment (procedimiento, presupuesto, tiempo, país de origen):

El sistema recomienda:

- **Mejor ciudad** (según procedimiento, disponibilidad, precios)  
- **Mejor clínica** (en esa ciudad o en varias si hay comparación)  
- **Mejor doctor** (especialista para ese procedimiento)  

Hoy ya existe lógica de recomendación (paquete, especialista por ciudad). La expansión geográfica implica **modelo `cities`** y **matching que use city_id** (y luego country_id) en lugar de solo texto.

---

## 9. Panel para clínicas (marketplace real)

Las clínicas podrán:

- Crear perfil  
- Subir tratamientos  
- Ver pacientes asignados  
- Gestionar agenda  

Eso convierte el proyecto en **marketplace B2B**. Es Fase 3 en [PLAN_12_MESES_ESCALADO.md](PLAN_12_MESES_ESCALADO.md); la expansión geográfica (cities, URLs, SEO) puede hacerse antes o en paralelo según prioridad.

---

## 10. Orden de implementación recomendado

Para que Cursor y el equipo avancen sin desorden:

| Paso | Acción | Notas |
|------|--------|--------|
| **1** | Añadir modelo **`cities`** en la base de datos | Migración: tabla `cities` (slug, name, country_id opcional, airport_code, description, published). Seed inicial: Medellín, Manizales, Bogotá, Cali, etc. |
| **2** | Crear rutas **`/cities/[city]`** | Página por ciudad: descripción, clínicas (providers con city_id = esa ciudad), paquetes disponibles, CTA a assessment. |
| **3** | Crear **páginas SEO por ciudad** | Ej.: `/veneers-medellin`, `/dental-tourism-medellin`. Reutilizar componente de landing con datos por ciudad (y procedimiento si aplica). |
| **4** | Asociar **clínicas (providers) a ciudades** | Añadir `city_id` a `providers`; migrar `city` (texto) a `city_id` donde exista match con `cities`. |
| **5** | (Opcional) **Paquetes por ciudad** | Añadir `city_id` a `packages` o derivar ciudad desde provider; filtros en listado y en matching. |
| **6** | (Futuro) **Tabla `countries`** y expansión internacional | Cuando se abran más países; `cities.country_id` y rutas `/countries/[country]`. |

No se ha modificado código ni esquema en este paso; solo se documenta el modelo para que la implementación sea coherente.

---

## 11. Estado actual del repo (resumen)

| Concepto | Estado actual | Para expansión |
|----------|----------------|----------------|
| Ciudades | Texto en `providers.city`, `packages.location`, `specialists.city`, `experiences.city` | Tabla `cities` + `city_id` en providers/packages |
| Países | No hay tabla | Tabla `countries` cuando se escale internacional |
| Rutas /cities | No existen | Añadir `/cities/[city]` y landings `/procedimiento-[city]` |
| Matching | Por ciudad (texto) y especialidad | Incluir `city_id` y luego `country_id` |

---

## 12. Ventaja actual

El proyecto ya tiene:

- Backend sólido  
- Pagos (Stripe)  
- Arquitectura (API, roles, auth)  
- CI y tests  
- Base de datos estructurada (providers, packages, specialists, leads, bookings)  

Eso permite convertir esto en un **marketplace real** añadiendo capas (cities, países, panel clínicas) sin reescribir el core.

---

## 13. Próximo nivel (opcional)

Para soportar **muy gran escala** (miles de clínicas, decenas de miles de pacientes, varios países) con buena organización y rendimiento, se puede documentar más adelante:

- Arquitectura de datos (particionamiento por país/región si hace falta)  
- Caché y CDN para landings SEO  
- API pública o interna por “región” para móvil o partners  

Ese nivel es el que suelen usar startups que luego levantan inversión seria.

---

*Documento de referencia para expansión geográfica. Visión de producto: [PRODUCT_VISION.md](PRODUCT_VISION.md). Plan 12 meses: [PLAN_12_MESES_ESCALADO.md](PLAN_12_MESES_ESCALADO.md).*
