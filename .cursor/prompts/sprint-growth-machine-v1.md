Use .cursor/prompts/sprint-template.md

Sprint goal:
Prepare the Smile platform for a Growth Engine that feeds new leads automatically.

Do NOT create heavy new systems.
Focus on groundwork.

Tasks:

1. Audit current lead flow

- assessment
- lead creation
- admin leads dashboard

Identify where external leads could plug in.

2. Prepare growth pipeline

Document pipeline:

- discovered
- replied
- assessment_sent
- converted_to_lead
- ignored

3. Design /admin/harvester page

Components:

- DataTable
- StatCard
- filters
- AI reply button

Columns:

- source
- content
- status
- created_at

4. AI responder concept

Create a helper module:

- lib/growth/aiResponder.ts

Input:

- post content

Output:

- suggested reply inviting user to take assessment.

Do NOT automatically send replies.

5. Analytics preparation

Add notes for tracking:

- lead source
- external_lead_id

without breaking schema.

6. Documentation

Create:

- docs/GROWTH_ENGINE_ARCHITECTURE.md

Include:

- pipeline
- scrapers
- AI responder
- admin harvester
- future automation

7. Verification

Run:

- npm run verify

