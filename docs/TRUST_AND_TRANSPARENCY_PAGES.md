## Trust and transparency pages

### New public pages

- `/trust-and-safety`
  - Explains how the marketplace is curated (no open listing).
  - Describes:
    - How clinics and specialists are vetted.
    - How hosts and experiences are reviewed.
    - Approval and verification model.
    - Family‑hosted experience standards.
    - Medical coordination boundaries and disclaimer.
    - Support and escalation guidance.

- `/how-payments-work`
  - Explains:
    - Deposit concept and when it applies.
    - That Stripe is used for secure card processing.
    - That payouts to hosts/specialists/clinics are currently managed **manually**.
    - The transition path toward Stripe Connect and automated payouts.
    - High‑level refund/dispute expectations (final terms still per‑package).

- `/our-clinical-network`
  - Explains:
    - How specialists are selected.
    - The role of clinics/providers.
    - How treatment packages are curated (clinical scope → logistics → optional experiences).
    - Why Medellín and Manizales are complementary in the patient journey.
    - What “trusted network” means in practice.

All pages use the existing dark theme and a premium, calm layout aligned with the main landing.

### Funnel integration

Links were added in the following places:

- **Landing (`/`) footer**
  - Under the “Legal” column:
    - `Trust & safety` → `/trust-and-safety`
    - `How payments work` → `/how-payments-work`
    - `Clinical network` → `/our-clinical-network`

- **Packages index (`/packages`)**
  - Below the WhatsApp CTA:
    - Inline links to:
      - `Trust & safety`
      - `How payments work`

- **Patient dashboard (`/patient`)**
  - Under the “Payment status” table:
    - Text hint + link: `Read how payments work →` → `/how-payments-work`

These links are intentionally contextual:

- Before booking: help users understand trust and money flow while browsing packages.
- After booking/payment: clarify how deposits and payouts work from the patient dashboard.

### Conversion and confidence

These pages aim to:

- Reduce friction for first‑time medical travelers by:
  - Explaining vetting and approval in non‑technical language.
  - Clarifying that Stripe handles deposits securely.
  - Stating that payouts are currently manual but moving toward Stripe Connect.
- Provide a reference point for coordinators:
  - They can link to these pages in WhatsApp/email conversations when patients ask “how does this work?”.

No auth, Stripe, checkout, webhook, or booking logic was changed as part of this sprint. All changes are additive and content‑oriented.

