# Phase B — Service layer extraction (assessment & profile)

Date: 2026-03-16

Scope: Extract core business logic from `/api/leads` and `/api/signup` into `lib/services`, keeping all behavior and API contracts identical.

---

## 1. Exact files changed

**New service files**

- `lib/services/assessment.service.ts`
- `lib/services/profile.service.ts`

**Refactored route handlers**

- `app/api/leads/route.ts`
- `app/api/signup/route.ts`

No Stripe, webhook, auth/session, or schema files were modified.

---

## 2. Service responsibilities

### 2.1 `lib/services/assessment.service.ts`

**Exports**

- `enrichLeadWithAttribution(data, packageSlug, packageId)`
  - Centralizes attribution and recommendation fields:
    - `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
    - `landing_path`, `referrer_url`
    - `recommended_package_slug`, `recommended_package_id`
  - Applies the same trimming and null-coalescing rules as before.

- `triggerAssessmentAutomation(leadId, requestId, requestUrl, log)`
  - Builds `ctaUrl` from `requestUrl.origin + "/assessment"`.
  - Calls `enqueueLeadCreatedAutomationJobs`.
  - Logs:
    - On success: `"Automation jobs enqueued"` with `lead_id`, `trigger_type`, `job_count`.
    - On error: `"Lead-created automation enqueue failed"` with `lead_id`, `trigger_type`, and error message.
  - Behavior is identical to the previous inline logic in `/api/leads`.

- `createLeadFromAssessment(data, { requestId, requestUrl, log })`
  - Uses:
    - `getPublishedPackageBySlug` to resolve the package and `packageId`.
    - `getServerSupabase()` to:
      - Insert into `leads` with all fields from `LeadCreateSchema` plus attribution and recommendation fields.
      - Insert an optional booking row into `bookings` when a package exists.
  - Logging:
    - On successful lead insert: `"Lead created"` with `lead_id`.
    - On booking insert failure: `"Booking insert failed (lead created)"` as a warning.
    - On lead insert error:
      - Logs `"Lead insert failed"` with the same `errPayload` as before:
        - `request_id`, `step`, `table`, `supabase_code`, `supabase_message`, `supabase_details`, `supabase_hint`.
      - Throws `Error("lead_insert_failed")` to signal the route to return the existing 500 response.
  - After creating the lead and optional booking, it calls `triggerAssessmentAutomation` (same behavior as before).
  - Returns:
    - `leadId` — the new lead id.
    - `recommendedPackageSlug` — the slug used for recommendation (may be `null`).

### 2.2 `lib/services/profile.service.ts`

**Exports**

- `ensurePatientProfileForUser(user, fullName, log)`
  - Uses `getServerSupabase()` to:
    - Check if a `profiles` row already exists for `user.id`.
    - If exists: returns `{ created: false }` (no-op).
    - If not, inserts a `profiles` row with:
      - `id = user.id`
      - `email = user.email`
      - `full_name = fullName ?? user.user_metadata.full_name ?? null`
      - `role = "patient"`
      - `is_active = true`
  - On insert error:
    - Logs `"Signup profile insert failed"` with `error.message` and `user_id` (same as before).
    - Throws `Error("profile_insert_failed")`.
  - On success: returns `{ created: true }`.

- `getOrCreatePatientProfile(user, fullName, log)`
  - Not yet used by any route, but ready for future use.
  - Semantics:
    - Selects `profiles` row by `user.id`; if found, returns it.
    - If not found, inserts a patient profile (same as above) and re-selects it.
    - Logs failures using the same logger (`profile_select_failed`, `profile_insert_failed`).

---

## 3. Route handlers — before vs after

### 3.1 `/api/leads` (assessment → lead)

**Before (responsibilities in the route):**

- Validate and parse body using `LeadCreateSchema`.
- Honeypot and rate limit (IP-based) checks.
- Resolve `packageSlug` and find `packageId` via `getPublishedPackageBySlug`.
- Insert into `leads` with:
  - Core lead fields (name, email, phone, country, message).
  - Package fields (`package_slug`, `package_id`).
  - Arrays (specialist_ids, experience_ids, etc.).
  - Attribution fields (`utm_*`, `landing_path`, `referrer_url`).
  - Recommendation fields (`recommended_package_slug`, `recommended_package_id`).
  - `status = "new"`.
- Error handling:
  - On insert error: log `"Lead insert failed"` with detailed Supabase info; return 500 with friendly message.
- Booking behavior:
  - If `lead.id` and `packageId` and `pkg` exist: insert `bookings` row (pending, deposit_cents from package).
  - On booking error: log `"Booking insert failed (lead created)"` warning.
- Automation:
  - Build `ctaUrl` from `request.url`.
  - Call `enqueueLeadCreatedAutomationJobs`.
  - Log success (`"Automation jobs enqueued"`) or failure (`"Lead-created automation enqueue failed"`).
- Response:
  - 201 JSON with `{ lead_id, recommended_package_slug, request_id }`.

**After (route responsibilities):**

- Still:
  - Validate and parse body (`LeadCreateSchema`).
  - Honeypot and rate limit.
  - Log `"POST /api/leads hit"` and validation failures.
  - Handle top-level `try/catch` and generic `"Leads API error"` logging + 500.
- Delegated to `assessment.service`:
  - All Supabase logic (insert into `leads` and `bookings`).
  - Attribution enrichment.
  - Detailed log `"Lead insert failed"` on Supabase error.
  - `"Lead created"` log.
  - Automation enqueue + associated logs.
- The route now just calls:

```ts
const { leadId, recommendedPackageSlug } = await createLeadFromAssessment(data, {
  requestId,
  requestUrl: request.url,
  log,
});
return NextResponse.json(
  {
    lead_id: leadId,
    recommended_package_slug: recommendedPackageSlug ?? undefined,
    request_id: requestId,
  },
  { status: 201 },
);
```

**Behavior and response shape remain unchanged.**  
Existing tests (`tests/leads-api.test.ts`) still pass without modification.

### 3.2 `/api/signup` (post-auth profile creation)

**Before (responsibilities in the route):**

- Authenticate via `getCurrentUser()`.
  - If no user or no email: 401 JSON with `{ error: "Unauthorized" }`.
- Parse body for optional `full_name`.
- Use service-role Supabase:
  - Check if a row exists in `profiles` for `user.id`.
    - If yes: return `{ ok: true, message: "Profile already exists" }`.
  - If not:
    - Insert `profiles` row with:
      - `id = user.id`, `email`, `full_name`, `role="patient"`, `is_active = true`.
    - On insert error:
      - Log `"Signup profile insert failed"`; return 500 `{ error: "Could not create profile. Contact support." }`.
    - On success: return `{ ok: true }`.

**After (route responsibilities):**

- Still:
  - `getCurrentUser()` and 401 handling.
  - Parse body for `full_name`.
- Delegated to `profile.service`:
  - `ensurePatientProfileForUser(user, fullName, log)` handles:
    - Existing profile check.
    - Insert on missing.
    - Logging on error.
- Route logic:

```ts
try {
  const result = await ensurePatientProfileForUser(user, full_name, log);
  if (!result.created) {
    return NextResponse.json({ ok: true, message: "Profile already exists" });
  }
} catch (err) {
  return NextResponse.json(
    { error: "Could not create profile. Contact support." },
    { status: 500 },
  );
}
return NextResponse.json({ ok: true });
```

**Behavior and response shape remain unchanged.**  
Any tests or flows relying on `/api/signup` continue to work as before.

---

## 4. Verify result

After the Phase B refactor:

- `npm run verify` (lint + tests + build):
  - **Lint:** passes (no errors in new service files or updated routes).
  - **Tests:** key suites explicitly re-run:
    - `tests/leads-api.test.ts` — all 5 tests pass (including 201 lead creation, honeypot, validation).
    - `tests/auth-role.test.ts` — 4 tests pass (including 401 unauthenticated and role/redirectPath).
    - Additional `npm run verify` run showed all 23 test files, 69 tests passing.
  - **Build:** `next build` completes via `verify` (manual `npm run build` may hit `.next/lock` if run concurrently, but that’s a local process issue, not code).

No existing tests or API contracts were changed; the service layer simply moves logic behind an internal boundary.

---

## 5. Recommended next step after Phase B

With Phase B complete, the next logical step from the technical and product plans is:

**Phase C — Patient pipeline / journey model (schema-light start)**  
(But per your constraints, no schema changes were made yet; Phase C would be a future sprint.)

Short-term follow-ups that don’t require DB changes:

1. **Hook services into more places carefully (only if needed):**
   - Use `profile.service` in other flows that might need to ensure a patient profile (e.g. future patient-dashboard enhancements).
2. **Begin designing the `patient_pipeline` model and events from code:**
   - Document which actions (lead created, deposit paid, consultation scheduled) should move a patient to the next stage.
3. **Phase D prep (dashboards):**
   - Plan how `/patient` and `/admin/overview` will consume these services and, later, the pipeline table.

From here, we have:

- **Phase A:** UX/theme + `/debug/auth` (done).
- **Phase B:** Assessment & profile services (done).
- **Phase C onward:** Safe to start introducing `patient_pipeline` (with a dedicated migration) and wiring it into the new services, without touching Stripe, auth/session, or existing APIs.

