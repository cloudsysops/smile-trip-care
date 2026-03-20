Use .cursor/prompts/sprint-template.md

Goal:
Strengthen the clinical progress system without schema changes.

Current components:

- lib/clinical/progress.ts
- /api/clinical/progress
- TreatmentProgressTimeline
- PatientNextStepCard
- SpecialistProgressUpdateForm

Tasks:

1. Admin visibility

Improve section in:

- /admin/leads/[id]

Show:

- Latest treatment stage
- Date
- Short note preview

Use existing badge/label patterns.

2. Clinical summary

If safe, add a small summary card in:

- /admin/overview

Example metrics:

- Patients in treatment
- Patients awaiting surgery
- Patients completed

Derived from latest treatment_progress rows.

3. UX improvements

Specialist progress form:

- Improve error messaging when no patient account exists.
- Show clear message: \"Ask patient to sign up with the same email they used for their assessment.\"

4. Code audit

Check:

- stage_key validation
- notes length
- status enum handling

Add safe guards if missing.

Do NOT change DB schema.

5. Documentation

Update:

- docs/CLINICAL_PROGRESS_SYSTEM.md

Include:

- data flow
- roles
- limitations
- admin visibility

6. Verification

- npm run verify

