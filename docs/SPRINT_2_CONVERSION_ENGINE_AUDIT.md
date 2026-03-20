# Sprint 2 — Conversion Engine: Audit and Plan

**Classification:** MODERATE (multi-step wizard, new client component, proposal layout changes).  
**Risk:** SAFE — Frontend-only; no Stripe, schema, auth, or API contract changes.

---

## Current flow (audit)

### Assessment (`/assessment`)
- **Page:** Server component; fetches `getPublishedPackages()`, passes `prefillPackageSlug` from `?package=`.
- **Form:** `AssessmentForm.tsx` (client). Single long form: Your details (name, email, phone, country) → Travel & preferences (travel_companions, budget_range, package_slug) → Message. Hidden honeypot `company_website`. Submit → `POST /api/leads` with same payload shape (LeadCreateSchema). On 201, redirect to `/assessment/proposal?lead_id=&recommended_package_slug=`.
- **Payload (unchanged):** first_name, last_name, email, phone, country, package_slug, message, travel_companions, budget_range, utm_*, landing_path, referrer_url, company_website. Optional: selected_specialties, specialist_ids, experience_ids, etc. (API accepts; form currently only sends package_slug from dropdown).

### Proposal (`/assessment/proposal`)
- **Page:** Server; reads `lead_id`, `recommended_package_slug` from searchParams; loads `getLeadByIdForMatching(lead_id)`, `getPublishedPackageBySlug(recommended_package_slug)`. Uses `treatmentTypes = leadContext.selected_specialties`, `savingsRange = getSavingsRange(treatmentTypes)` (e.g. "50–70%").
- **Sections:** Hero, Estimated savings card (%), Journey stepper (5 steps), Suggested package (if any), Trust ("Why choose us"), CTAs (WhatsApp generic message, View packages, Pay deposit, Back to home), FAQ, link to thank-you.
- **WhatsApp:** Hardcoded message: "Hi! I just completed my Smile Assessment on MedVoyage Smile and I'd like to speak with a coordinator."

### Thank-you
- Linked from proposal; receives `lead_id` and `recommended_package_slug`. No changes this sprint.

---

## Files to change

| File | Change |
|------|--------|
| `app/assessment/page.tsx` | Render wizard instead of single form; minimal layout (progress-only top bar during wizard; no site nav in wizard). |
| `app/assessment/AssessmentWizard.tsx` | **New.** Client wizard: Step 1 Treatment Selection (package_slug / interest), Step 2 Smile History (message), Step 3 Timeline (travel_companions, budget_range), Step 4 Contact (first_name, last_name, email, phone, country). Top progress bar, localStorage draft (optional), same POST body and redirect to proposal. |
| `app/assessment/AssessmentForm.tsx` | Keep for fallback or remove from page; wizard will own submit. (Option: keep component and reuse step-4 fields; for simplicity wizard will own all steps and build same payload.) |
| `app/assessment/proposal/page.tsx` | Add Savings Widget (Estimated US cost placeholder, MedVoyage package price/deposit, You Save $X or %); strengthen Journey Timeline headline; add "Why MedVoyage" trust block (international coordination, secure deposit, 24h response, guided care); replace WhatsApp message with personalized treatment-aware message. |
| No backend changes | Lead API, validation, thank-you, Stripe, auth unchanged. |

---

## Risk

- **SAFE:** No API contract or backend behavior change. Wizard submits same JSON. Proposal remains server-rendered; only copy, layout, and one personalized WhatsApp string (server-computed) change.
- **Regression:** Ensure wizard step 4 includes honeypot field and all required/optional fields so lead creation and redirect to proposal still work.

---

## Implementation order

1. Create branch `feature/sprint-2-conversion-engine`.
2. Add `AssessmentWizard.tsx` (4 steps, progress bar, localStorage draft optional, submit to `/api/leads`, redirect to proposal).
3. Update `app/assessment/page.tsx` to use wizard and hide header/footer in wizard (minimal top bar with progress only).
4. Update `app/assessment/proposal/page.tsx`: Savings Widget, Journey headline, Why MedVoyage block, personalized WhatsApp message.
5. Run `npm run verify` and open PR.
