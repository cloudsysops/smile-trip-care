Use .cursor/prompts/sprint-template.md

Sprint goal:
Make the Smile Transformation Platform QA environment truly usable for end-to-end testing.

Primary host:
https://smile-transformation-platform-dev.vercel.app

Tasks:

1. Verify migrations in QA
- 0020_leads_recommended_package.sql
- 0021_treatment_progress.sql

Ensure the QA database contains these tables:
- leads
- packages
- treatment_progress

If missing:
document how to apply them via Supabase SQL editor.

2. Test critical flows

Assessment flow
- /assessment
- submit
- lead appears in /admin/leads

Auth flow
- /login
- /signup
- verify login for roles:
  - admin
  - patient
  - specialist
  - coordinator
  - provider

Clinical progress
- /specialist
- /specialist/progress?lead_id=...
- save progress
- verify appears in /patient timeline

3. Verify health endpoints

- /api/health
- /api/health/ready
- /api/auth/me

4. Improve reliability

Add defensive guards for:
- missing profile_id
- missing lead
- invalid stage_key
- empty notes payload

Do NOT change API contracts.

5. Run verification

- npm run verify

6. Documentation

Create:

- docs/QA_FULL_READINESS_REPORT.md

Include:
- host used
- flows tested
- issues fixed
- remaining risks

