# MedVoyage Smile — 3 motores de crecimiento automáticos

Documento estratégico para activar crecimiento mientras el producto ya funciona. **No requiere programar de inmediato**; el funnel ya está estable.

---

## Contexto

- **Funnel actual:** assessment → POST /api/leads → proposal → admin leads.
- **Objetivo:** Reducir carga del coordinador y subir conversión con IA y automatización ligera.
- **Arquitectura objetivo:** assessment → POST /api/leads → Supabase → (AI summary, priority, drafts) → Admin dashboard → coordinador contacta al paciente.

---

## 1️⃣ Motor 1 — AI Lead Copilot

**Qué hace:** Cuando llega un lead, genera automáticamente:

- Resumen del caso
- Prioridad del lead (HIGH / MEDIUM / LOW)
- Mensaje de WhatsApp listo
- Email listo
- Sugerencia de tratamiento

**Ejemplo:**

| Lead        | John, implants, 3 months, budget medium |
|------------|------------------------------------------|
| **Summary** | Patient interested in dental implants, planning travel within 3 months. |
| **Priority** | HIGH |
| **Suggested WhatsApp** | Hi John, thanks for completing your smile assessment. Based on your answers, our coordinators can help review implant options and estimated savings. Would you like to discuss your treatment plan on WhatsApp? |

**Valor:** El coordinador solo tiene que revisar, copiar y enviar.

**Prompt para Cursor:** Ver [.cursor/prompts/ai-lead-copilot-sprint.md](../.cursor/prompts/ai-lead-copilot-sprint.md) (en la raíz del repo: `.cursor/prompts/ai-lead-copilot-sprint.md`).

---

## 2️⃣ Motor 2 — Lead scoring automático

**Qué hace:** Clasifica leads en HIGH / MEDIUM / LOW según:

- Timeline
- Tratamiento
- Presupuesto
- País

**Ejemplo:** Implants + timeline 3 months → HIGH. Ayuda a priorizar pacientes sin tocar esquema pesado.

---

## 3️⃣ Motor 3 — Follow-up automático

**Qué hace:** Si el lead no responde:

- **24h:** WhatsApp tipo: *Hi John, just checking in to see if you had time to review your smile plan. Our coordinator can answer any questions about treatment and travel.*
- **3 días:** Mensaje de seguimiento suave: *If you're still considering treatment abroad, we can help you plan the timing and costs. Happy to walk you through the options.*

**Valor:** Aumenta conversiones sin que el coordinador tenga que recordar cada lead.

---

## Orden sugerido de implementación

1. **Motor 1 (AI Lead Copilot)** — Resumen + prioridad + borradores en admin. Máximo impacto con un solo sprint.
2. **Motor 2 (Scoring)** — Puede integrarse en el mismo flujo que el Copilot (prioridad como salida del LLM o reglas simples).
3. **Motor 3 (Follow-up)** — Requiere cola/workers y plantillas; hacer cuando el flujo de leads y admin esté estable.

---

## Siguiente nivel (futuro)

**MedVoyage Growth Engine:** Automatizar captación desde Reddit, Google, TikTok, referidos y alimentar el mismo funnel (assessment → leads → proposal → admin).

---

## Referencias en repo

- **Prompt Cursor (Motor 1):** [.cursor/prompts/ai-lead-copilot-sprint.md](../.cursor/prompts/ai-lead-copilot-sprint.md)
- **Funnel y QA:** [docs/ENGINEERING_WORKFLOW.md](ENGINEERING_WORKFLOW.md), [docs/QA_RELEASE_PLAYBOOK.md](QA_RELEASE_PLAYBOOK.md)
- **Conversión:** [docs/CONVERSION_IMPROVEMENTS_REPORT.md](CONVERSION_IMPROVEMENTS_REPORT.md)
