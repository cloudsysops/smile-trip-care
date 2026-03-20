# AI Lead Copilot — MedVoyage Smile

The AI Lead Copilot helps coordinators respond faster by generating a **lead summary**, **priority**, and **copy-paste ready WhatsApp and email drafts** from the lead’s assessment data.

---

## How it works

1. **Where:** In Admin → Leads → open a lead. The **AI Lead Copilot** section appears below lead details.
2. **Trigger:** Click **Generate summary & drafts**. The app sends the lead’s data to an LLM (OpenAI) and receives structured output.
3. **Output:**
   - **Summary:** 1–3 sentence plain-English summary (treatment interest, timeline, context).
   - **Priority:** HIGH / MEDIUM / LOW (based on treatment clarity, timeline, budget).
   - **Suggested WhatsApp:** Short message to send the lead; coordinator can copy and send.
   - **Suggested email:** Email body (and optional subject); coordinator can copy and edit.

If the LLM is unavailable or fails, the app shows a **fallback** (rule-based summary and generic drafts). The UI indicates “Suggested draft (AI unavailable).”

---

## How summaries and messages are generated

- **Input:** First name, last name, email, phone, country, package/treatment interest (`package_slug`, `selected_specialties`), message/notes, travel companions, budget range.
- **Model:** Uses the same OpenAI model as other AI features (`OPENAI_API_KEY`, optional `OPENAI_MODEL`).
- **Prompt:** The system prompt instructs the model to:
  - Summarize the lead in 1–3 sentences.
  - Set priority (high = clear treatment + near-term timeline + budget; medium = clear interest; low = exploratory).
  - Produce a short WhatsApp message (thank them, reference their interest, invite to discuss).
  - Produce an email with the same intent, professional tone.
- **Output:** JSON with `summary`, `priority`, `whatsapp_draft`, `email_draft`, optional `email_subject`. Validated with Zod; invalid or failed responses trigger the fallback.

---

## How coordinators should use it

1. Open the lead in Admin → Leads → [lead].
2. Click **Generate summary & drafts** in the AI Lead Copilot section.
3. Read the **summary** and **priority** to triage quickly.
4. Use **Suggested WhatsApp**: click **Copy**, paste into WhatsApp, adjust if needed, send.
5. Use **Suggested email**: click **Copy**, paste into your email client, set subject if shown, edit if needed, send.
6. Use **Regenerate** if you want a fresh draft (e.g. after lead updates or different angle).

The copilot does **not** send messages automatically. It only suggests text; the coordinator decides when and how to contact the lead.

---

## Technical details

- **API:** `POST /api/admin/ai/copilot` with body `{ "lead_id": "<uuid>" }`. Admin-only; rate-limited.
- **Service:** `lib/ai/lead-copilot.ts` — `generateLeadCopilot(input)` and `getLeadCopilotFallback(input)`.
- **Schema:** `LeadCopilotOutputSchema` in `lib/ai/schemas.ts` (summary, priority, whatsapp_draft, email_draft, email_subject).
- **No schema change:** Nothing is stored in the database; each generation is on-demand. No new tables or columns.

---

## Configuration

- `OPENAI_API_KEY`: Required for AI-generated drafts. If missing, only the fallback is returned.
- `OPENAI_MODEL`: Optional; defaults to the same model used by other AI features.

---

## Safety and fallback

- If the API key is missing, the service returns the fallback immediately (no LLM call).
- If the LLM throws or returns invalid JSON, the API returns the fallback and sets `from_fallback: true`.
- The admin UI always receives a valid response (either AI or fallback) so the coordinator can still copy and edit.

---

## AI safety guidelines (Lead Copilot)

- Never include secrets (API keys, tokens, internal URLs) in prompts or model responses.
- Always validate the model output against strict schemas (Zod) before using it.
- Keep fallbacks in place so coordinators always have a usable draft when the model fails or is unavailable.
- Log errors and failures with enough context to debug, but without leaking personally sensitive data from patients.
- Keep a human in the loop: Lead Copilot only suggests drafts; coordinators review and decide what to send.
