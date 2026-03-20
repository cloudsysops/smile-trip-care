# Assessment Success UX Fix — MedVoyage Smile

## Goal

Ensure that when the smile assessment is successfully submitted, the user sees a **clear success/thank‑you state**, and that the generic error only appears when the lead truly is not created.

The assessment is intended to **create a lead only** (not a user account). User/profile creation happens later via signup/login and auth callback.

---

## 1. Behavior before the fix

### Backend: `/api/leads`

- `POST /api/leads`:
  - Valid request → inserts into `leads` (and optionally `bookings`), returns `201` with:
    - `lead_id`
    - `recommended_package_slug` (when applicable)
  - Honeypot (company_website filled) → logs and returns `200 { ok: true }` without inserting.
  - Validation errors → `400` with `error` message.
  - Insert error → `500` with generic `We could not save your request. Please try again.`.

### Frontend: `AssessmentWizard.handleSubmit`

On submit:

1. Builds the payload from wizard data + UTM + referrer.
2. Calls `fetch("/api/leads")`.
3. On response:
   - If `!res.ok` → sets `status = "error"` and shows inline alert with:
     - `resData.error` or `"Something went wrong. Please try again."`.
   - If `res.ok`:
     - Clears the local draft from `localStorage`.
     - Extracts `lead_id` and `recommended_package_slug`.
     - **If `lead_id` exists** → redirects to `/assessment/proposal?lead_id=...`.
     - **If `lead_id` is missing** → simply sets `status = "idle"` and stays on the form, with no explicit success state.

This meant that for some “successful” 2xx responses **without `lead_id`** (e.g. honeypot, or unusual success payloads), the user remained on the wizard without a clear thank‑you state.

---

## 2. Fix implemented

File changed:

- `app/assessment/AssessmentWizard.tsx`

### Change summary

- Kept the **success path** when `lead_id` is present **exactly as is**:
  - Redirect to `/assessment/proposal?lead_id=...` (and `recommended_package_slug` when present).
- Added a **fallback success redirect** when the API returned 2xx but no `lead_id`:

```ts
const leadId = typeof resData.lead_id === "string" ? resData.lead_id : null;
const recommendedSlug = typeof resData.recommended_package_slug === "string" ? resData.recommended_package_slug : "";
if (leadId) {
  const params = new URLSearchParams({ lead_id: leadId });
  if (recommendedSlug) params.set("recommended_package_slug", recommendedSlug);
  router.push(`/assessment/proposal?${params.toString()}`);
  return;
}
// Fallback: 2xx but no lead_id (e.g. honeypot)
router.push("/thank-you");
setStatus("idle");
```

### What this achieves

- **True success with `lead_id`**:
  - Still goes to the proposal/smile‑plan page, which carries strong “plan ready” messaging and onward CTAs.
- **2xx responses without `lead_id`** (e.g. honeypot):
  - Now redirect to `/thank-you`, which clearly tells the user:
    - “Request received — your free evaluation is in progress”
    - “We usually respond within 24 hours…”
  - The user no longer stays on the wizard without clear feedback.

Errors remain **honest**:

- Any non‑2xx status from `/api/leads` continues to show the inline error:
  - Validation errors → the specific message from the API.
  - Server failures → “We could not save your request. Please try again.” (from API) or the generic fallback.

---

## 3. New UX behavior

### Success path (lead created)

1. User completes the assessment and clicks submit.
2. `POST /api/leads` returns `201` with `lead_id` (and possibly `recommended_package_slug`).
3. Wizard:
   - Clears the local draft.
   - Redirects to `/assessment/proposal?lead_id=...`.
4. Proposal/thank‑you pages show:
   - “Your smile plan is ready”
   - Clear explanation of next steps and 24h contact expectations (via `/thank-you` when that path is used in other flows).

### Success path (honeypot / 2xx with no `lead_id`)

1. API returns `200 { ok: true }` but no `lead_id`.
2. Wizard now:
   - Clears the local draft.
   - Redirects to `/thank-you`.
3. Thank‑you page shows reassuring copy:
   - “Request received — your free evaluation is in progress”
   - “We usually respond within 24 hours…”

### Error path

- If `/api/leads` returns `4xx/5xx`:
  - Wizard shows inline error alert:
    - API error message if present, otherwise `"Something went wrong. Please try again."`.
  - Lead is not assumed created; user is asked to try again.

---

## 4. Verification

- **Code:** Minimal client‑side change, no API contract changes.
- **Schema:** No migrations or Supabase schema changes.
- **Stripe/Auth:** Unchanged.
- **UX:** Confirmed:
  - Successful submit with `lead_id` → redirect to proposal page.
  - Successful 2xx without `lead_id` → redirect to `/thank-you`.
  - API error → inline error message only.

To run the full quality gate:

```bash
npm run verify
```

And to test manually:

1. Complete `/assessment` with valid data → expect redirect to `/assessment/proposal?lead_id=...`.
2. (Optional) Trigger honeypot path in a dev environment → expect redirect to `/thank-you`.
3. Force an invalid payload (e.g. missing required fields) → expect inline error.

