# Platform Improvement Plan — MedVoyage Smile

Date: 2026-03-15  
Scope: Product and platform roadmap from MVP to production-grade SaaS.

---

## A. Product vision

MedVoyage Smile is a **dental tourism and care coordination platform** connecting international patients with a curated network of clinics and specialists in Colombia (Medellín, Manizales, and beyond).

**From MVP to SaaS:**

- **Today (MVP):**
  - Patients can submit a **free assessment**.
  - The platform creates a **lead** and supports an **admin-led sales and operations flow**:
    - Assessment → lead → AI triage / reply → Stripe deposit → bookings/consultations.
  - Admin dashboard and AI/automation tools help run the early operation.
- **Target (SaaS foundation):**
  - The platform becomes a **multi-tenant-like operations system** for MedVoyage:
    - Clear **role-based dashboards** (admin, specialist, patient, provider).
    - A **patient journey pipeline** that tracks each patient across assessment → treatment → follow-up.
    - A **growth engine** built on outbound, attribution, and analytics.
  - Over time, it can evolve into:
    - A **marketplace / network platform** for verified clinics and specialists.
    - A **SaaS product** that could be extended beyond dental (other specialties, cities, regions).

---

## B. Improvement roadmap by area

### B1. UX

- Establish a cohesive **dark theme** with a clean medical + modern SaaS aesthetic.
- Unify typography and spacing across landing, assessment, and dashboards.
- Provide clear, consistent navigation:
  - Global header with brand, key CTAs (assessment, login, dashboard).
  - Sidebar for dashboards (admin, patient, specialist, provider).
- Improve microcopy to:
  - Reinforce trust and clarity (who is behind the platform, clinical partners).
  - Make next steps explicit after each action (assessment submitted, deposit paid, etc.).

### B2. Patient journey

- Introduce a **patient journey timeline** visible from `/patient` and optionally from admin:
  - Stages: assessment submitted → clinical review → proposal shared → deposit paid → consultation scheduled → travel planning → treatment in progress → follow-up care.
- Connect existing data:
  - `leads.status`, `bookings`, `consultations`, `payments`, `clinical/progress`.
- Future: use `patient_pipeline` to track state machine transitions explicitly, enabling:
  - SLA tracking (time in each stage).
  - Automated reminders (e.g. deposit not paid, consultation not scheduled).

### B3. Admin operations

- Build an **assessment review queue**:
  - Prioritize new leads, pending triage, or those needing manual review.
  - Integrate AI outputs (triage, reply suggestions, ops notes) into a structured workflow.
- Enhance the **admin overview**:
  - KPIs: new leads, pending follow-up, deposits, bookings, pipeline distribution by stage.
  - Links into detailed queues for action.
- Add visibility into:
  - Provider and specialist approvals (curated network).
  - Automation status (jobs succeeded, pending, dead-letter).

### B4. Provider/specialist workflows

- Specialists:
  - `/specialist` dashboard with:
    - Today/this week’s consultations.
    - Upcoming schedule.
    - Associated patients/leads.
  - Clear indicators for which cases require their attention.
- Providers (clinics/tour operators):
  - `/provider` dashboard (later phase) with:
    - Packages and experiences linked to them.
    - Bookings and pipeline of incoming patients.
    - Basic operational metrics.

### B5. Payments & bookings

- Improve **deposit visibility**:
  - In `/patient`, show payment status clearly (e.g. “Deposit pending / paid”).
  - In `/admin`, highlight leads that are close to paying or recently paid.
- Clarify the **relationship between lead, booking, and payment**:
  - Ensure admin and patient can see which booking is tied to which payment.
  - Show “what’s next” after deposit (consultation, travel, etc.).

### B6. Growth engine

- Use existing attribution fields (`utm_*`, `landing_path`, `referrer_url`) to:
  - Build simple attribution reports (which campaigns bring qualified leads).
  - Understand lead quality from different channels (Reddit, paid, organic).
- Strengthen the **outbound engine**:
  - Curate standard follow-up templates for WhatsApp and email.
  - Provide clear metrics (messages sent, replies, booked consultations).
  - Add filters and views in the outbound command center.

### B7. AI layer

- Build on existing AI agents (`/api/ai/{triage,respond,itinerary}`) to:
  - Improve prompt design for medical clarity and empathy.
  - Provide **explainable** summaries: why a certain package or itinerary is suggested.
  - Add optional AI-based **next-step suggestions** for admins (e.g. “send deposit link”, “offer alternative package”).
- Long-term:
  - Use AI to help with **clinical notes** and **follow-up** recommendations (with strict guardrails).

### B8. Trust, diagnostics, security

- Diagnostics:
  - Add `/debug/auth` for safe inspection of current session/profile/role.
  - Add `/debug/system` (later) for env + health + feature flags.
- Trust:
  - Surface curated network partners (institutions, specialists) more prominently, but only with verified and safe content.
  - Clear disclaimers about roles: platform vs clinics, billing, and responsibilities.
- Security:
  - Strengthen role guards and RLS verification.
  - Add better rate limiting and anomaly detection around auth and payments in later phases.

---

## C. SaaS maturity roadmap

### Stage 1 — Functional MVP (current state)

- Landing, assessment, packages, thank-you.
- Admin leads + assets + AI tools (triage, replies, itineraries).
- Stripe checkout + webhook for deposits.
- Basic role-based dashboards for admin and patient (initial versions).
- Dev deploy and initial QA environment running.

### Stage 2 — Operational SaaS

- Robust **role dashboards**:
  - Admin, patient, specialist, provider (minimally viable).
- **Patient journey pipeline** modeled and partially visualized.
- Structured **service layer** under `lib/services/*` for core flows (assessment, signup, profile, payments, pipeline).
- Better **observability**:
  - `/debug/auth`, `/debug/system`, error tracking.
- A small set of **operational runbooks**:
  - How to review assessments.
  - How to handle deposits.
  - How to coordinate treatment and travel.

### Stage 3 — Marketplace / network platform

- Mature **curated network**:
  - Onboarding, approval, and visibility for providers and specialists.
  - Clear listing of packages, experiences, and itineraries by provider.
- Multi-role dashboards are feature-complete for:
  - Admin, specialist, provider, patient.
- **Patient pipeline** is:
  - Populated consistently as events happen (assessment, deposit, booking, consultation, travel, follow-up).
  - Used to drive both operations and analytics.
- **Growth engine**:
  - Attribution dashboards and growth experiments integrated directly into admin UI.

### Stage 4 — Automation + AI-assisted operations

- AI not only drafts but:
  - Helps triage, route, and prioritize leads and patients.
  - Suggests pipeline actions and follow ups.
- **Automation workers**:
  - Triggered by pipeline state transitions.
  - Drive reminders, educational content, and operational tasks.
- **Advanced analytics and forecasting**:
  - Conversion by stage, by package, by channel.
  - Capacity planning (consultations, chair time).

---

## D. High-impact features

Examples of features that materially move the platform toward SaaS maturity:

- **Full dark theme** (Phase A):
  - Consistent and premium UI.
  - Improves perceived quality and differentiation.
- **Patient journey timeline**:
  - Makes status obvious to patients and admins.
  - Anchors the entire SaaS around patient progress.
- **Payment status clarity**:
  - For patients: “Deposit pending / paid / confirmed”.
  - For admins: quick filters and counts for deposit-related stages.
- **Specialist assignment workflow**:
  - From lead or booking, assign specialist; show in both admin and specialist dashboard.
- **Admin review queue**:
  - New/pending assessments with AI triage visible.
  - Clear actions: request more info, send proposal, send deposit link.
- **Diagnostics pages**:
  - `/debug/auth` (Phase A), later `/debug/system`, `/debug/pipeline`.
- **Travel checklist**:
  - For patients: pre-travel documents, packing, clinic instructions, recovery tips.
- **Communications center**:
  - Unified view of outbound messages, replies, and manual notes.
- **Pipeline visibility**:
  - Visual overview of patients by stage; drill-down into individuals.
- **Analytics and growth cockpit**:
  - Simple dashboards for lead sources, conversion, and outbound performance.

---

## E. Quick wins vs strategic builds

### Quick wins (1–2 days)

- Implement global **dark theme foundation** (Phase A).
- Add **ThemeToggle** and persist theme in `localStorage`.
- Add `/debug/auth` page (read-only, no secrets).
- Improve copy and surface trust elements on landing and assessment (small UX tweaks).
- Add “Payment status” panel on `/patient` (read-only using existing data).
- Add a simple “Assessment review” list on `/admin/overview` using existing leads.

### Medium builds

- Extract **assessment** and **profile** logic into `lib/services/*` and refactor APIs to use them (Phase B).
- Introduce `patient_pipeline` table and minimal service (Phase C).
- Implement **patient journey timeline** on `/patient` using existing data + early `patient_pipeline`.
- Build **admin review queue** and “pipeline overview” sections on `/admin`.
- Create **specialist dashboard** with consultations list and basic KPIs.
- Add basic observability (e.g. Sentry) for APIs and critical pages.

### Long-term platform bets

- Fully model and operationalize the **patient pipeline** across all roles and flows.
- Build a robust **marketplace experience** for providers and specialists (self-service in parts, admin-curated always).
- Develop a **growth cockpit** that merges attribution, outbound, and pipeline analytics into actionable levers.
- Expand **AI capabilities** from messaging and triage to operational intelligence (e.g. “which patients are at risk of dropping off”, “which leads to prioritize today”).
- Introduce multi-region or multi-clinic support with per-clinic dashboards, if the business scales in that direction.

---

## F. Summary and alignment with technical phases

- **Phase A (now):** Dark theme, `/debug/auth`, security sanity check. Improves UX and trust without altering core flows.
- **Phase B/C:** Service layer + patient pipeline schema. Establishes a robust core for SaaS logic and journey tracking.
- **Phase D:** Dashboard evolution (patient, admin, specialist, provider). Turns the product into a daily-use operational tool.
- **Phase E/F:** Growth and observability layers. Enable scale, experimentation, and operational excellence.

This plan is designed so that **each phase is independently valuable**, and no phase blocks the platform from continuing to operate or sell as we gradually upgrade it into a full SaaS foundation.

