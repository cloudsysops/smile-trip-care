# Phase C+ — Patient pipeline wiring (lead_created → assessment_submitted)

**Date:** 2026-03-16  
**Scope:** Safely connect only the `lead_created` event to `patient_pipeline`, without touching Stripe, webhook, auth core, or dashboards.

---

## 1. Exact wiring point

**Function:** `createLeadFromAssessment`  
**File:** `lib/services/assessment.service.ts`

After:

- The lead row is inserted into `public.leads`.
- (Optional) booking is created for the package.
- Automation jobs are triggered via `triggerAssessmentAutomation`.

We now:

1. Look up a matching patient profile by email.
2. If found, write one row into `public.patient_pipeline` with stage `\"assessment_submitted\"`.
3. Log and continue regardless of pipeline outcome.

This keeps `/api/leads` behavior and response **unchanged** while making the pipeline table useful.

---

## 2. Exact pipeline stage written

- **Stage value:** `\"assessment_submitted\"`  
  (one of the `PatientPipelineStage` options defined in `lib/services/patient-pipeline.service.ts`)

- **Table:** `public.patient_pipeline`

- **Insert payload (conceptual):**

  ```ts
  await recordStageTransition({
    patientId: profile.id,
    assessmentId: lead.id,
    stage: "assessment_submitted",
    notes: "Assessment submitted via /api/leads",
  });
  ```

---

## 3. How `patient_id` is resolved

**Step:** inside `createLeadFromAssessment`, after successful lead creation and automation:

```ts
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id")
  .eq("email", data.email)
  .maybeSingle();
```

- **If `profile?.id` exists and `profileError` is null:**
  - Call `recordStageTransition` with:
    - `patientId = profile.id`
    - `assessmentId = lead.id`
    - `stage = "assessment_submitted"`
    - `notes = "Assessment submitted via /api/leads"`

- **If no row is found or there is an error in this lookup:**
  - Log a safe message and **skip** the pipeline write.

This resolution never affects the main lead insert; it only controls whether the optional pipeline row is written.

---

## 4. Fallback behavior when no profile exists

If the profile lookup fails (for example, assessment before signup or profile not created yet):

- We log:

```ts
log.info("No matching patient profile found for pipeline; skipping", {
  lead_id: lead.id,
  email: data.email,
});
```

- We **do not**:
  - Throw an error,
  - Change response status,
  - Or alter lead/booking/automation behavior.

If `recordStageTransition` itself returns an error:

```ts
if (pipelineError) {
  log.warn("Patient pipeline write failed after lead creation", {
    lead_id: lead.id,
    patient_id: profile.id,
    error: pipelineError,
  });
}
```

And if any unexpected exception occurs around this block:

```ts
log.warn("Patient pipeline write skipped due to error", {
  lead_id: lead.id,
  error: err instanceof Error ? err.message : String(err),
});
```

In all cases, `/api/leads` still returns **201** with the same response shape when the lead was created successfully.

---

## 5. Files changed

- `lib/services/assessment.service.ts`
  - Imports `recordStageTransition`.
  - After `Lead created` + `triggerAssessmentAutomation`, resolves `patient_id` (by email) and writes one `assessment_submitted` stage to `patient_pipeline` when possible.

- `tests/leads-api.test.ts`
  - Mocks `getServerSupabase` and `recordStageTransition`.
  - Adds assertions:
    - Pipeline is called with `{ patientId, assessmentId, stage: "assessment_submitted" }` on success.
    - `/api/leads` still returns 201 even when `recordStageTransition` returns an error.

- `docs/PHASE_C_PLUS_PIPELINE_WIRING_REPORT.md` (this file).

No changes were made to:

- Stripe logic or webhook handler.
- Auth/session flow.
- Response shape of `/api/leads`.
- Existing dashboards.

---

## 6. Verification result

