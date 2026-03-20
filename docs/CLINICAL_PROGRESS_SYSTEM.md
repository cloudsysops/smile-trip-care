# Clinical Progress System — MedVoyage Smile

**Phase 1 (current):** Audit, schema, stage config, documentation.  
**Phase 2 (next):** Specialist workflow, patient visibility, reusable UI components.

---

## 1. Executive summary

The Clinical Progress System adds a **treatment progress timeline** so that:
- Specialists can update progress (stage + notes) for assigned patients.
- Patients can see where they are in the care journey (current stage, completed steps, next step).
- The platform feels like a premium medical concierge + clinical operations product.

**Phase 1 deliverables:** Migration for `treatment_progress` table, central stage config, audit of existing routes, and this document with Phase 2 read/write plan.

---

## 2. Phase 1 audit summary

### 2.1 Routes and dashboard structure (existing)

| Route | Purpose | Data source | Layout / components |
|-------|---------|-------------|----------------------|
| **/patient** | Patient dashboard | `getPatientDashboardData(email)` → leads, bookings, consultations, payments by lead email | Custom header + main; uses `TreatmentPlanSection`, `TravelPlanSection`, `TreatmentTimelineSection`, `CareCoordinatorSection`, `AftercareSection`. No `DashboardLayout` yet. |
| **/specialist** | Specialist dashboard | `getSpecialistDashboardData(specialistId)` → specialist row, consultations for that specialist | Custom header + main; table of consultations (lead_id, status, requested_at, scheduled_at). No `DashboardLayout`; no progress UI. |
| **/admin** | Admin entry | Redirect / overview | `AdminShell` with nav (Leads, Outbound, Analytics, Assets, Status). |
| **/admin/leads** | Lead list | Admin API / server | `DashboardLayout` + `DataTable`. |
| **/admin/leads/[id]** | Lead detail | Lead + packages + lead_ai + itineraries + outbound_messages | Detail page; no treatment progress yet. |
| **/admin/overview** | Overview metrics | Counts (leads, bookings, etc.) | `DashboardLayout` + `StatCard` grid. |
| **/admin/analytics** | Analytics | Leads metrics + charts | `DashboardLayout` + `DashboardSection`. |

### 2.2 Dashboard components (reusable)

- **StatCard**, **DataTable**, **DashboardLayout** (with `DashboardHeader`, `DashboardSection`) — used in admin.
- **TreatmentTimelineSection** — takes `steps: { id, label, status, detail? }[]`; used on patient page with derived steps (consultation → travel → procedure → recovery → follow-up) from booking/consultation dates.
- **TreatmentPlanSection**, **TravelPlanSection**, **CareCoordinatorSection**, **AftercareSection** — patient journey blocks; no link to `treatment_progress` yet.

### 2.3 Identity and linkage (existing)

- **Patient:** Identified by `profiles.id` (auth.uid()). Patient data is loaded by **email** match on `leads` → then bookings, consultations, payments for those lead IDs. There is no direct `profiles.id` → lead/booking in schema; link is **lead.email = profile.email**.
- **Specialist:** `profiles.specialist_id` → `specialists.id`. Assignments come from **consultations**: `consultations.specialist_id` + `consultations.lead_id`. So “assigned cases” = consultations where specialist_id = current specialist. No separate assignment table.

### 2.4 Gaps for clinical progress (Phase 2)

- Patient dashboard does not yet show rows from `treatment_progress`; timeline is derived from booking/consultation dates only.
- Specialist dashboard has no “update progress” flow; only consultation list.
- No API yet to create/update/list `treatment_progress` with role checks.

---

## 3. Data model (Phase 1)

### 3.1 Table: `treatment_progress`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK, default gen_random_uuid() |
| patient_id | uuid | NOT NULL, references profiles(id) on delete cascade. Canonical patient. |
| specialist_id | uuid | Nullable, references specialists(id) on delete set null |
| lead_id | uuid | Nullable, references leads(id) on delete set null |
| booking_id | uuid | Nullable, references bookings(id) on delete set null |
| stage_key | text | NOT NULL, e.g. assessment_completed, procedure_scheduled |
| stage_label | text | NOT NULL, patient-friendly label |
| status | text | NOT NULL, default 'active'; check (active, completed, cancelled) |
| notes | text | Nullable |
| attachments | jsonb | Default '[]' |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

**Indexes:** patient_id; specialist_id (partial); lead_id (partial); (patient_id, created_at desc).

**RLS:**
- Patient: SELECT where patient_id = auth.uid().
- Specialist: SELECT, INSERT, UPDATE where specialist_id matches profile.specialist_id.
- Admin: full access via is_admin().

### 3.2 Migration file

- **File:** `supabase/migrations/0021_treatment_progress.sql`
- **Order:** After 0020_leads_recommended_package.sql (see MIGRATION_ORDER.md).

---

## 4. Stage config (Phase 1)

- **File:** `lib/clinical/stages.ts`
- **Exports:** `TREATMENT_STAGES`, `TreatmentStageKey`, `TreatmentStage`, `getStageByKey`, `getStageLabel`, `getOrderedStageKeys`.

**Stages (order):**

| stage_key | stage_label |
|-----------|-------------|
| assessment_completed | Assessment completed |
| treatment_plan_ready | Treatment plan ready |
| coordinator_follow_up | Coordinator follow-up |
| travel_planning | Travel planning |
| procedure_scheduled | Procedure scheduled |
| procedure_completed | Procedure completed |
| healing_phase | Healing phase |
| final_review | Final review |

---

## 5. How specialist assignment will work (Phase 2)

- **No new assignment table.** “Assigned cases” = consultations where `consultations.specialist_id` = current user’s `profile.specialist_id`.
- For each such consultation we have `lead_id`. Lead has `email`. We can resolve “patient” for display either by:
  - **Option A:** Lead-only view: show lead_id / lead name/email; when creating `treatment_progress`, set `lead_id`, `patient_id` = resolve from lead (e.g. first profile that matches lead.email, or leave patient_id null and use lead_id for display — but schema requires patient_id, so we must resolve profile from lead.email).
  - **Option B:** Require that the lead’s email matches a profile (the “patient” who logged in). Then patient_id = that profile.id. Specialist sees “cases” = consultations; for each, we have lead → we look up profile by lead.email to get patient_id and to show progress for that patient.
- **Recommended:** In Phase 2, specialist “assigned cases” = list of consultations (existing). For “update progress,” we need one patient_id per “case”: resolve **patient_id** from lead by finding a profile with that lead’s email (if any). If no profile exists, we can still create progress with patient_id = NULL only if we change schema — but schema currently has patient_id NOT NULL. So: **when creating a treatment_progress row, require a profile that matches the lead’s email** and set patient_id = profile.id; specialist_id = current specialist; lead_id = consultation.lead_id; booking_id optional from booking for that lead.
- Document in Phase 2: “Assigned cases” = consultations for this specialist; “patient” for progress = profile linked by lead.email (if no profile, we cannot create progress until they sign up / get a profile).

---

## 6. How patient progress will be read (Phase 2)

- **Query:** List `treatment_progress` where `patient_id = auth.uid()` (or profile.id from requirePatient()), ordered by `created_at desc` (or asc for timeline order).
- **Display:** Use existing `TreatmentTimelineSection` pattern or new `TreatmentProgressTimeline` that maps `treatment_progress` rows to steps (stage_key → stage_label, status, notes, date). Current stage = latest row with status 'active' or latest row; completed = status 'completed' or past stages.
- **Data source:** New server helper or API that runs this query with RLS (patient sees only own rows). Patient dashboard already has `requirePatient()` and profile; pass profile.id to the helper.

---

## 7. Files created/changed (Phase 1)

| File | Action |
|------|--------|
| supabase/migrations/0021_treatment_progress.sql | Created |
| lib/clinical/stages.ts | Created |
| supabase/migrations/MIGRATION_ORDER.md | Already listed 0021 |
| docs/CLINICAL_PROGRESS_SYSTEM.md | Created (this file) |

No changes to existing app routes, auth, or Stripe. No UI workflows implemented yet.

---

## 8. What was intentionally deferred (Phase 2+)

- Specialist UI: list cases, open case, update stage + notes, save.
- Patient UI: timeline from treatment_progress, current stage, next step, latest note.
- API routes for create/update/list treatment_progress with role checks.
- Reusable components: TreatmentProgressTimeline, TreatmentStageBadge, SpecialistProgressUpdateForm, PatientNextStepCard.
- Admin: optional small view (e.g. latest stage on lead detail).
- Notifications, chat, file uploads, advanced audit.

---

## 9. Recommended next sprint (Phase 2)

1. **API:** POST/GET (and optionally PATCH) for treatment_progress (specialist: create/update for own specialist_id; patient: read own by patient_id; admin: read all).
2. **Specialist dashboard:** Extend /specialist with DataTable of “assigned cases” (from consultations); open case → form to set stage + notes → save to treatment_progress (resolve patient_id from lead.email → profile).
3. **Patient dashboard:** Extend /patient with progress timeline from treatment_progress (patient_id = profile.id); show current stage, completed steps, next step, latest note; reuse or extend TreatmentTimelineSection pattern.
4. **Reusable components:** Implement TreatmentProgressTimeline, stage badge, and minimal forms per this doc.
5. **Verification:** npm run verify; apply 0021 in QA/dev and smoke-test.

---

## 10. Applying the migration (QA/dev)

After pulling Phase 1:

```bash
npm run db:migrate
```

Or in Supabase SQL Editor (dev project), run the contents of `supabase/migrations/0021_treatment_progress.sql` after 0020.

---

## 11. Phase 2 implementation (done)

### 11.1 API routes

| Route | Method | Role | Behavior |
|-------|--------|------|----------|
| `/api/clinical/progress` | GET | patient, specialist, admin | List: patient = own (patient_id), specialist = own (specialist_id), admin = all |
| `/api/clinical/progress` | POST | specialist only | Create: body `lead_id`, `stage_key`, `notes?`, `booking_id?`; resolve patient_id from lead.email → profile; 400 if no profile |
| `/api/clinical/progress/[id]` | GET | patient / specialist / admin | Single row; 403 if not own (patient_id or specialist_id) or admin |
| `/api/clinical/progress/[id]` | PATCH | specialist or admin | Update stage_key, stage_label, status, notes; 403 if not owner specialist or admin |

### 11.2 Role checks

- **List:** `getCurrentProfile()`; patient → `getProgressForPatient(profile.id)`; specialist → `getProgressForSpecialist(profile.specialist_id)`; admin → `getProgressForAdmin()`.
- **Create:** Require `profile.role === "specialist"` and `profile.specialist_id`; `resolvePatientIdFromLead(lead_id)` → 400 if null; `specialistHasConsultationForLead(specialistId, lead_id)` → 403 if false; then `createProgress(...)`.
- **Update:** Require specialist or admin; `getProgressById(id)`; 403 if specialist and row.specialist_id !== profile.specialist_id; then `updateProgress(id, body)`.

### 11.3 patient_id resolution

- **Flow:** `lead_id` → `leads.email` → `profiles` where `ilike("email", email)` → `profile.id` = patient_id.
- **When no profile for lead:** API returns **400** with message: *"No patient account found for this lead. The patient must sign up with the same email to see progress."* (Known limitation of the vertical slice.)

### 11.4 UI components

- **TreatmentProgressTimeline** — `app/components/dashboard/TreatmentProgressTimeline.tsx`: list of progress items (stage, date, notes).
- **TreatmentStageBadge** — `app/components/dashboard/TreatmentStageBadge.tsx`: stage label + status styling.
- **SpecialistProgressUpdateForm** — `app/components/dashboard/SpecialistProgressUpdateForm.tsx`: stage select, notes textarea, POST to create.
- **PatientNextStepCard** — `app/components/dashboard/PatientNextStepCard.tsx`: current stage, latest note, next step from ordered stages.

### 11.5 Specialist flow

- **/specialist:** Consultations table now has column "Progress" with link "Update progress" → `/specialist/progress?lead_id=<lead_id>`.
- **/specialist/progress:** Page with `searchParams.lead_id`; if missing, message "Select a case from the dashboard". If present: `SpecialistProgressClient` fetches GET `/api/clinical/progress`, filters by lead_id, shows `TreatmentProgressTimeline` + `SpecialistProgressUpdateForm(leadId)`; on success refetches list.

### 11.6 Patient flow

- **/patient:** New section "Clinical progress" with two columns: `TreatmentProgressTimeline` (items from `getProgressForPatient(profile.id)`) and `PatientNextStepCard` (latest = most recent progress row; shows current stage, latest note, next step).

### 11.7 Manual test steps (vertical slice)

1. **Apply migration 0021** in QA/dev DB (see §10).
2. **Specialist:** Log in as a user with role `specialist` and `profile.specialist_id` set. Go to `/specialist`. Ensure at least one consultation exists for that specialist.
3. Click **"Update progress"** for one consultation → opens `/specialist/progress?lead_id=...`.
4. Choose a **stage** and optional **notes**, click **Save progress**. Should succeed only if a profile exists with the same email as the lead; otherwise 400 with message about patient sign-up.
5. **Patient:** Log in as a user whose `profile.email` matches the lead used in step 4. Go to `/patient`. In "Clinical progress" you should see the timeline entry and the "Current stage" / "Next step" card.
6. Run **`npm run verify`** (lint, test, build) and confirm green.
