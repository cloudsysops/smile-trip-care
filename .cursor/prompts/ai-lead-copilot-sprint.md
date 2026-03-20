# Sprint: AI Lead Copilot — MedVoyage Smile

Use .cursor/prompts/sprint-template.md

Sprint goal:
Implement an AI Lead Copilot for MedVoyage Smile that summarizes leads, prioritizes them, and drafts coordinator responses.

Business objective:
Reduce coordinator workload and increase conversion by automatically generating lead summaries and suggested responses.

Risk target:
SAFE / MODERATE only

Hard constraints:
- Do NOT modify Supabase schema
- Do NOT modify Stripe core logic
- Do NOT modify Stripe webhook logic
- Do NOT modify auth core logic
- Do NOT change API contracts
- Avoid large architectural changes

Context:
The current funnel is:
assessment → POST /api/leads → proposal → admin leads.

We want AI assistance once a lead is created.

Tasks:

1. Create an AI helper service
Add a small service that uses an LLM to generate:

- lead summary
- lead priority (high/medium/low)
- WhatsApp message draft
- email draft

2. Generate summary from lead fields
Use fields such as:

- treatment interest
- timeline
- budget
- travel companion
- country

Return structured output.

3. Integrate into admin lead view
When viewing a lead, show:

- AI summary
- AI priority
- suggested WhatsApp message
- suggested email

4. Ensure safety
If AI fails, fallback gracefully.

5. Documentation
Create:

AI_LEAD_COPILOT.md

Explain:

- how summaries work
- how messages are generated
- how coordinators should use them.

6. Verification
Run:

npm run verify

Ensure no regression.

Required output:

- files added
- files modified
- AI integration summary
- example generated output
- recommended improvements
