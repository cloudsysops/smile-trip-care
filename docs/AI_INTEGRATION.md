# AI Integration (Claude structured triage)

## 1. Descripción General

Esta integración agrega capacidades de IA basadas en **Claude** para triage de leads con **respuestas estructuradas** (JSON validado con Zod), más mecanismos de producción para que la plataforma **nunca falle** si Claude:
- se demora (timeout),
- devuelve error,
- o no está disponible (fallbacks).

### Casos de uso actuales (en esta repo)

1. **Lead triage (estructurado)**
   - `summarizeLead(leadId)` -> devuelve `LeadSummary`
   - `classifyLeadIntent(leadId)` -> devuelve `LeadIntent`
   - `recommendNextStep(leadId)` -> devuelve `RecommendedAction`
   - `analyzeLeadComplete(leadId)` -> hace 1 llamada con prompt combinado y devuelve `LeadAnalysis`

2. **Fallbacks y resiliencia**
   - Si Claude falla tras retries, se retorna un payload por defecto (configurable por env vars).

3. **Rate limiting + cache (in-memory)**
   - Rate limit in-memory para controlar abuso y proteger costos.
   - Cache TTL en memoria para evitar recomputar prompts idénticos (10 minutos).

### Arquitectura de 3 capas

1. **Cliente / UI**
   - Ejemplo: `AISummaryButton` (admin) que llama un endpoint HTTP y renderiza el resultado.

2. **Prompts / Validación**
   - `lib/ai/prompts/*` construye prompts y define schemas Zod.

3. **Servicios / Lógica**
   - `lib/services/ai/*` orquesta: fetch -> sanitize -> prompt -> Claude wrapper -> retorno tipado.

## 2. Setup

### 2.1 Obtener API key de Anthropic

- Crea una API key en el panel de Anthropic.
- Ejemplo esperado:
  - `ANTHROPIC_API_KEY=...`

### 2.2 Configurar variables de entorno

Recomendado colocar la clave en `.env` (o `.env.local`):

```bash
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
```

Opcional para fallbacks (si quieres override):

```bash
AI_FALLBACK_LEAD_SUMMARY_TEXT="Lead assessment pending. Please review manually."

# JSON override (opcional, debe ser un objeto)
AI_FALLBACK_LEAD_INTENT_JSON='{"confidence":0}'
AI_FALLBACK_RECOMMENDED_ACTION_JSON='{"action":"manual_review","priority":"medium"}'
```

### 2.3 Verificar instalación

- Instala dependencias:
  - `npm install`
- Ejecuta tests:
  - `npm test`
- Verifica build:
  - `npm run verify`

## 3. Arquitectura

### 3.1 Diagrama de carpetas (alto nivel)

```text
app/
  components/ai/AISummaryButton.tsx
  api/ai/* (endpoints AI existentes)
  api/admin/ai/* (endpoints admin AI existentes)

lib/
  ai/
    claude.ts              # wrapper Claude + retry + cache + fallbacks
    rate-limiter.ts       # rate limiter in-memory (singleton)
    fallbacks.ts          # fallbacks por tipo
    fallback-config.ts    # config por env
    prompts/lead-triage.ts# prompts + Zod schemas
    sanitizers/lead.ts    # sanitizeLead allowlist
    logger.ts             # logAIUsage best-effort (si existe ai_usage_logs)

  services/ai/
    lead-ai.service.ts    # summarize/classify/recommend/analyze (orquestación)
```

### 3.2 Flujo de datos (end-to-end)

```mermaid
flowchart LR
  A[UI / Admin Button] --> B[API Route]
  B --> C[lead-ai.service.ts]
  C --> D[sanitizeLead(lead)]
  C --> E[Prompt builders + Zod schemas]
  E --> F[Claude wrapper: lib/ai/claude.ts]
  F --> G[Rate limit + cache + retry]
  F --> H{OK?}
  H -- Yes --> I[JSON validado (Zod)]
  H -- No --> J[Fallback por tipo]
  I --> K[Return tipado]
  J --> K
```

### 3.3 Capas (cliente -> prompts -> servicios -> API)

- **Cliente**: obtiene el resultado desde un endpoint y lo renderiza.
- **Prompts** (`lib/ai/prompts/*`): crean contratos (`ZodSchema`) y texto de prompt.
- **Servicios** (`lib/services/ai/*`): orquestan fetch + sanitize + prompts + Claude.
- **API** (`app/api/*`):
  - actualmente existen endpoints AI basados en OpenAI (`/api/ai/*`, `/api/admin/ai/*`),
  - y el endpoint Claude structured para leads está **pendiente** (ver sección API Reference).

## 4. Uso

### 4.1 Llamar servicios AI desde código (server)

Ejemplo usando el service layer:

```ts
import { analyzeLeadComplete } from "@/lib/services/ai/lead-ai.service";

const analysis = await analyzeLeadComplete(leadId);
// analysis: { summary, intent, action }
```

Ejemplo con funciones individuales:

```ts
import {
  summarizeLead,
  classifyLeadIntent,
  recommendNextStep,
} from "@/lib/services/ai/lead-ai.service";

const summary = await summarizeLead(leadId);
const intent = await classifyLeadIntent(leadId);
const action = await recommendNextStep(leadId);
```

### 4.2 Ejemplo: endpoint (cuando esté implementado)

El componente admin actual llama:

- `POST /api/ai/lead-triage`

Body:

```json
{ "leadId": "uuid-lead-id" }
```

Response esperado:

```json
{
  "success": true,
  "data": {
    "summary": "Lead assessment pending...",
    "intent": "unknown",
    "confidence": 0,
    "action": "manual_review",
    "priority": "medium"
  }
}
```

> Importante: en esta repo todavía **no existe** `app/api/ai/lead-triage/route.ts`. Debe implementarse para que el botón funcione.

### 4.3 Mejores prácticas

1. **Siempre usar el service layer** (`lib/services/ai/*`) en lugar de llamar Claude directamente.
2. **No enviar PII**: usa `sanitizeLead` (ya está en el pipeline del service).
3. **Pasar userId para rate limit per-user**:
   - `lib/ai/claude.ts` soporta `ClaudeOptions.userId`,
   - pero el service actual (`lead-ai.service.ts`) todavía no lo inyecta.

## 5. Seguridad

### 5.1 Qué datos se sanitizan

`lib/ai/sanitizers/lead.ts` aplica allowlist y deriva información segura:
- `id`, `status`, `source`, `createdAt`
- `basicInfo.*` (solo datos no sensibles):
  - `country`
  - `preferred_city`
  - `selected_specialties` (como categoría general)
  - `budget_range` (solo si parece rango)
  - `message_preview` se omite (no se reenvía contenido médico)

### 5.2 Qué NO se envía a Claude

Se omite/evita reenviar:
- email completo
- teléfono completo
- nombres completos
- detalles médicos sensibles (incluye contenido del `message` como “preview”)
- información de pagos

### 5.3 Rate limiting

`lib/ai/rate-limiter.ts` (singleton in-memory) limita:
- global: `50 req/min`
- per-user: `10 req/min` (si se pasa `userId` en `ClaudeOptions`)

Cuando se excede el límite, el wrapper:
- registra el evento en logs,
- y (si el caller provee `fallbackType`) puede retornar fallback tipado para que la app siga funcionando.

## 6. Monitoring

### 6.1 Dashboard

Existe la base para monitoreo en:
- logs estructurados vía `createLogger(...)` (stdout/stderr)
- fallback usage count en memoria (solo útil para debug)

Existe `lib/ai/logger.ts` con `logAIUsage(...)` (best-effort) para insertar en `ai_usage_logs`.

> Nota: en el repo actual **no hay migración** para `ai_usage_logs`, por lo que en runtime el insert puede fallar y se **ignora** (no debe romper la app).

### 6.2 Métricas disponibles

Por logs:
- `Claude request start / success / failed`
- `Claude response cache hit`
- `Claude request rate-limited`
- `Claude fallback used`

Por fallback:
- contador in-memory por tipo (tests/diagnóstico)

### 6.3 Cómo interpretar logs

Busca campos comunes:
- `request_id` (correlación)
- `lead_id` (si el service lo incluye)
- `fallback_type`
- `durationMs`

## 7. Troubleshooting

### Errores comunes

1. **Claude timeout**
   - Se dispara cuando el call excede `timeoutMs` del wrapper.
   - Resultado: retries y fallback si `fallbackType` está configurado.

2. **Rate limit excedido**
   - Se lanza `RateLimitError`.
   - Resultado: si el caller pasó fallbackType, retorna fallback tipado; si no, `null` (caller debe manejarlo).

3. **Respuesta no válida / Zod fail**
   - Ocurre cuando Claude devuelve JSON malformado o con keys inesperadas.
   - Resultado: el wrapper intenta fallback si está habilitado.

### Soluciones

- Asegura que los prompts y schemas coincidan.
- Aumenta `maxTokens` si la salida se trunca.
- Revisa sanitización si el modelo no entiende el contexto (pero sin reintroducir PII).

### Cómo reportar problemas

Incluye:
- `request_id`
- `lead_id`
- `fallback_type` (si aplica)
- el error de schema o el message de excepción

## 8. Costos

### Estimación mensual

La estimación depende de:
- volumen de leads
- tokens promedio
- frecuencia (cache hit ratio)

Para estimar:
- mide tokens usados en producción (cuando `ai_usage_logs` exista),
- o usa métricas aproximadas por ventana.

### Optimizaciones implementadas

1. **Cache TTL (10 min)**
   - Evita recomputar respuestas por prompt idéntico.
2. **Rate limiting**
   - Protege contra abuso y reduce llamadas.
3. **Fallback**
   - Evita reintentos infinitos y asegura continuidad del negocio.

### Cómo reducir costos

1. Aumentar el porcentaje de cache hits (prompts deterministas).
2. Limitar por usuario y por ventana (per-user).
3. Reducir tamaño de prompt (ya está optimizado en `lead-triage.ts`).
4. Usar `analyzeLeadComplete` (1 llamada) en vez de 3 llamadas separadas.

## 9. Roadmap

Features futuras sugeridas:

1. **Endpoint Claude structured para leads**
   - Implementar `POST /api/ai/lead-triage` para que el botón admin funcione.
2. **Inyección de `userId` en `lead-ai.service.ts`**
   - Para que rate limit sea realmente per-user.
3. **Persistencia real de `ai_usage_logs`**
   - Para el dashboard de monitoring (requests/tokens/costo).
4. **Mejorar cache**
   - Cache con hashing de prompt y estrategias de invalidez por versión.

## 10. API Reference

### 10.1 Endpoints disponibles (actuales)

**OpenAI (agentes)**:
- `POST /api/ai/triage`
  - Body: `{ lead_id: string }`
  - Output: `{ triage, request_id }`
- `POST /api/ai/respond`
  - Body: `{ lead_id: string, cta_url?: string }`
  - Output: `{ ...reply, generated_at, ... }`
- `POST /api/ai/itinerary`
  - Body: `{ lead_id: string, start_date?: "YYYY-MM-DD", days?: number, includes_tour?: boolean }`
  - Output: depende del agent
- `POST /api/ai/reply-suggestion`
  - Body: `{ postText: string, keyword?: string }`
  - Output: `{ reply, fallbackUsed }`

**Admin OpenAI (agentes)**:
- `POST /api/admin/ai/triage`
  - Body: `{ lead_id: string }`

### 10.2 Endpoints Claude structured (pendiente)

- `POST /api/ai/lead-triage`
  - Body: `{ leadId: string }`
  - Response:
    ```json
    { "success": true, "data": { "summary": "...", "intent": "unknown", "confidence": 0, "action": "manual_review", "priority": "medium" } }
    ```

### 10.3 Error codes (propuesta para `/api/ai/lead-triage`)

En un endpoint protegido por admin/specialist:
- `401`: no autenticado
- `403`: no autorizado (no admin/specialist)
- `400`: `leadId` inválido (no UUID)
- `429`: rate limit excedido
- `500`: error interno

> El manejo de fallback garantiza que la app no crashee si Claude falla (retornando valores por defecto).

