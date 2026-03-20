# Sprint: Admin visibility + better error UX (clinical progress)

Use when: After 0021 is applied in QA and the vertical slice has been validated.

---

Use .cursor/prompts/sprint-template.md

**Sprint goal:** Add low-risk admin visibility for clinical progress and improve the specialist UX when progress cannot be saved because no matching patient profile exists.

**Business objective:** Make clinical progress easier to operate by:
- showing the latest treatment stage in admin where useful
- making the "no patient account found" error clearer and more actionable

**Risk target:** SAFE / MODERATE only

**Hard constraints:**
- Do NOT modify Stripe logic
- Do NOT modify Stripe webhook logic
- Do NOT modify auth core logic
- Do NOT add new schema beyond the existing treatment_progress migration
- Do NOT broadly refactor dashboards
- Keep the scope small and operational

**Tasks:**

1. **Review current clinical progress flow**
   - Inspect: specialist progress save flow, patient timeline flow, admin lead/detail pages where a small progress preview could be useful.

2. **Improve specialist error UX**
   When POST /api/clinical/progress fails because no patient profile matches the lead email:
   - keep the backend behavior honest
   - improve the UI message so it clearly says: the patient must sign up using the same email as the lead in order to see progress
   - make the message actionable and non-technical

3. **Add small admin visibility**
   If low-risk and straightforward, show the latest treatment stage in one useful admin location (e.g. lead detail, admin leads list, or a compact preview block).
   Keep it minimal: latest stage label, date, maybe latest note preview if helpful.

4. **Reuse existing dashboard system**
   Use current patterns: DashboardLayout, DataTable, badges/cards if useful.

5. **Verification**
   Run: `npm run verify`

6. **Report**
   Create: `docs/CLINICAL_PROGRESS_STEP3_REPORT.md`

**Required final output:**
- files changed
- exact admin visibility added
- exact UX improvement for the 400 case
- verification result
- recommended next step
