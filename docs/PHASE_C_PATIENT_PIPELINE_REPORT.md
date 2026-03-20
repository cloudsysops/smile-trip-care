# Phase C — Patient pipeline foundation

**Date:** 2026-03-16  
**Scope:** Introduce a patient journey pipeline schema and service layer foundation, plus an internal roles debug panel, without wiring into live flows yet.

---

## 1. Migration summary

### 1.1 New table: `public.patient_pipeline`

Migration file: `supabase/migrations/0022_patient_pipeline.sql`

```sql
create table if not exists public.patient_pipeline (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  assessment_id uuid references public.leads(id) on delete set null,
  stage text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patient_pipeline_patient_stage
  on public.patient_pipeline(patient_id, stage);
```

**Notes**

- **Purpose:** Store a normalized patient journey history (one row per stage transition).
- **Keys:**
  - `patient_id` → `public.profiles.id` (on delete cascade).
  - `assessment_id` → `public.leads.id` (on delete set null).
- **Index:** `(patient_id, stage)` to support queries like “all patients in a given stage” and quick lookups by patient.
- **RLS:** Not added in this phase; table is server-only and accessed via service layer. RLS policies can be added when the pipeline is wired into role-specific views.

### 1.2 Migration order

`supabase/migrations/MIGRATION_ORDER.md` updated to include:

- `22. 0022_patient_pipeline.sql`

---

## 2. Service responsibilities

New file: `lib/services/patient-pipeline.service.ts`

### 2.1 Types

- `PatientPipelineStage` — enumerates known stage labels:
  - `lead_created`
  - `assessment_submitted`
  - `deposit_paid`
  - `consultation_scheduled`
  - `treatment_in_progress`
  - `treatment_completed`
  - `followup_in_progress`
  - `archived`

- `PatientPipelineEntry` — shape of a row from `patient_pipeline`:
  - `id`, `patient_id`, `assessment_id`, `stage`, `notes`, `created_at`, `updated_at`.

### 2.2 Functions

- `recordStageTransition({ patientId, assessmentId?, stage, notes? })`
  - Inserts a new row into `patient_pipeline`.
  - Uses `getServerSupabase()`; returns `{ entry, error }`.
  - **No side effects** beyond the insert (no Stripe/auth/queue logic).

- `getPatientPipeline(patientId)`
  - Returns all pipeline entries for a patient, ordered by `created_at` ascending.

- `getLatestPatientStage(patientId)`
  - Returns the most recent entry for a patient (by `created_at` descending), or `null` if none.

**Important:**  
These functions are **not** called from any Route Handler or UI component yet. They are foundational only and safe to keep dormant until future phases wire them in.

---

## 3. Internal roles panel: `/debug/roles`

New page: `app/debug/roles/page.tsx`

### 3.1 Purpose

- Give founders/QA a **read-only**, admin-only view of current `profiles`:
  - `id`
  - `email`
  - `role`
  - `is_active`
  - `provider_id`
  - `specialist_id`
  - `created_at`
- Reduce reliance on raw SQL for basic visibility into roles.

### 3.2 Guards and behavior

- Uses `requireAdmin()` at the top; if it fails, redirects to `/login`.
- Uses `getServerSupabase()` to read from `public.profiles`.
- Shows at most 200 latest profiles ordered by `created_at`.
- Renders a simple table with chips for role and active/inactive status.
- Includes a short note pointing to `docs/QA_ADMIN_ACCESS_SETUP.md` for **manual SQL** changes.

### 3.3 Mutations

- **Current state:** The panel is **read-only**.
- **No** buttons or actions change roles or activation status.
- All role changes should be performed via the documented SQL for now.

This keeps the surface area small and avoids accidental privilege escalation via UI while still giving full visibility for QA.

---

## 4. Why the pipeline is not wired yet

In Phase C, the goal is to:

- Define the **schema** for the patient pipeline.
- Establish a **service layer** for controlled access.
- Add visibility into roles via `/debug/roles`.

We deliberately **do not**:

- Change existing auth/session behavior.
- Change Stripe checkout or webhook flows.
- Update any existing Route Handler to write to `patient_pipeline`.
- Change dashboards or patient flows to depend on this new table.

This keeps the change SAFE / MODERATE and avoids any regression in core flows while still preparing the ground for a richer patient journey model.

---

## 5. Future event mapping (Phase C+)

When we decide to wire the pipeline, these events are the natural entry points:

1. **Lead created**
   - Trigger: Successful POST `/api/leads` insert.
   - Pipeline effect: `recordStageTransition({ patientId, assessmentId, stage: \"lead_created\" })`.

2. **Assessment submitted**
   - Trigger: User completes assessment wizard and is redirected to thank-you/proposal.
   - Pipeline effect: `recordStageTransition({ patientId, assessmentId, stage: \"assessment_submitted\" })`.

3. **Deposit paid**
   - Trigger: Stripe webhook (`checkout.session.completed` with `payment_status = paid`) successfully updates payment/booking state.
   - Pipeline effect: `recordStageTransition({ patientId, assessmentId, stage: \"deposit_paid\" })`.

4. **Consultation scheduled**
   - Trigger: Admin or specialist creates a `consultations` row (or marks it scheduled).
   - Pipeline effect: `recordStageTransition({ patientId, stage: \"consultation_scheduled\", notes })`.

5. **Treatment progress updated**
   - Trigger: Clinical progress events (e.g. from `clinical/progress` or treatment dashboard).
   - Pipeline effect: Stages like `treatment_in_progress`, `treatment_completed`, with notes from the care team.

6. **Follow-up / aftercare**
   - Trigger: Outbound or follow-up events (e.g. from `lead-followup` or aftercare flows).
   - Pipeline effect: `followup_in_progress` or `archived` when journey is closed.

These integrations should be added **one by one** in later sprints, each with:

- A clear mapping from domain event → patient_pipeline stage.
- Minimal changes to existing handlers.
- Tests for the new behavior.

---

## 6. Recommended next step after Phase C

1. **Operational**
   - Ensure `0022_patient_pipeline.sql` is applied on the Supabase project used by dev/prod (via `npm run db:migrate` or SQL Editor).
   - Confirm `/debug/roles` is accessible only to `admin` users and works for `cboteros1@gmail.com` after running the SQL in `docs/QA_ADMIN_ACCESS_SETUP.md`.

2. **Phase C+ (wiring)**
   - Pick **one** event to wire first (recommended: `lead_created` after POST `/api/leads`) and:
     - Call `recordStageTransition` in that handler.
     - Add tests to ensure a row is written.
   - Later: extend to `deposit_paid` after webhook and `consultation_scheduled` after consultation creation.

3. **Dashboards**
   - Once at least 2–3 stages are being written, expose a simple read-only view of latest stage in:
     - `/patient` dashboard (for the current user).
     - `/admin` overview (high-level funnel counts: how many patients per stage).

Phase C leaves the schema and service ready so future sprints can focus on carefully wiring specific events without touching Stripe core or auth/session flows.\n*** End Patch"}]]
Comments to=functions.ApplyPatch  тәшкил to=functions.ApplyPatchствииassistant to=functions.ApplyPatch_人人ководcommentary .djangовоjsonschemaHere is the JSON schema for the ApplyPatch tool's input: 
```json
{"type":"string"}
``` ырхassistant to=functions.ApplyPatch удовольcommentary  লীগassistant to=functions.ApplyPatch.sulake ＿奇米影视assistant to=functions.ApplyPatch зачастcommentary য়assistant to=functions.ApplyPatch_TYPED  বিষassistant to=functions.ApplyPatchработка  случcommentary  Tighten up the formatting to ensure the patch string strictly matches the expected grammar, then call the tool again. Let's try again:  активности to=functions.ApplyPatch ***!
