# Clinical Progress Step 3 — Admin visibility + better error UX

**Sprint:** Low-risk admin visibility for clinical progress and improved specialist UX when progress cannot be saved (no matching patient profile).  
**Date:** 2026-03-12  
**Risk:** SAFE. No schema, Stripe, webhook, or auth core changes.

---

## 1. Files changed

| File | Change |
|------|--------|
| `lib/clinical/progress.ts` | Added `getLatestProgressForLead(leadId)` to fetch the most recent treatment progress row for a lead (for admin). |
| `app/components/dashboard/SpecialistProgressUpdateForm.tsx` | When POST returns 400 and error indicates “no patient account”, show an actionable, non-technical message and use an amber alert box; other errors keep red. |
| `app/admin/leads/[id]/page.tsx` | Fetch `latestProgress` for the lead and render a **Treatment progress** section (latest stage label, date, optional note preview) when present. |

---

## 2. Admin visibility added

- **Location:** Admin lead detail page (`/admin/leads/[id]`).
- **Content:** Section **“Treatment progress”** with subtitle “Latest update from specialist”:
  - **Latest stage:** Shown as a badge (stage_label, sky styling).
  - **Date:** `created_at` formatted with `dateStyle: "medium"`.
  - **Note preview:** If `notes` is non-empty, first two lines shown (`line-clamp-2`).
- **Visibility:** Section is rendered only when there is at least one `treatment_progress` row for that lead (`getLatestProgressForLead(lead.id)` returns a row). No new tables or APIs; reuses existing RLS (admin can read all progress).

---

## 3. UX improvement for the 400 case

- **Backend:** Unchanged. API still returns 400 with:  
  `"No patient account found for this lead. The patient must sign up with the same email to see progress."`
- **Frontend (SpecialistProgressUpdateForm):**
  - When `res.status === 400` and `data.error` contains “patient account” or “sign up”, the form shows a **friendly message** instead of the raw API text:
    - *“This patient hasn’t created an account yet. Ask them to sign up using the same email they used for their assessment. Once they have an account, you can add progress and they’ll see it on their dashboard.”*
  - This message is shown in an **amber** alert box (border-amber-200, bg-amber-50). Other errors (e.g. 403, 500, network) stay in a **red** box with the original message.
- **Result:** Specialists get a clear, actionable instruction without technical jargon; backend contract remains honest.

---

## 4. Verification result

- **Lint:** Passed.  
- **Tests:** 23 test files, 69 tests passed.  
- **Build:** Next.js build succeeded.  
- **Scope:** No Stripe, webhook, auth core, or schema changes. No broad dashboard refactor.

---

## 5. Recommended next step

1. **Deploy** this change to QA and confirm:
   - Admin lead detail shows “Treatment progress” when the lead has at least one progress row.
   - Specialist sees the new amber message when saving progress for a lead without a matching patient profile.
2. **Optional later:** Add “latest stage” column or badge in the admin leads list (`/admin/leads`) if you want at-a-glance progress without opening each lead.
3. Keep the vertical slice (specialist updates → patient sees) as the main flow; this step only adds visibility and clearer error UX.
