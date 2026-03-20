# Investor demo — Patient journey (end-to-end)

Use this runbook to run the full patient journey for the investor demo.

---

## Prerequisites

- App running (local: `npm run dev` or deployed URL).
- Supabase: migrations applied, at least one **admin** user (Auth + `profiles.role = 'admin'`).
- Vercel/env: `STRIPE_*`, `SUPABASE_*` set. Stripe webhook configured for deployed URL.

---

## Demo flow (9 steps)

### STEP 1 — Patient visits landing

- Open `/` (landing).
- **Show:** Hero with "Free Smile Evaluation", packages, trust section.

### STEP 2 — Patient clicks "Free Smile Evaluation"

- Click **Free Smile Evaluation** (header or hero CTA).
- **Result:** Navigate to `/assessment`.

### STEP 3 — Patient completes assessment

- Fill: First name, Last name, Email (use a real email you control for Step 9).
- Optionally: phone, country, select a package.
- Submit.
- **Result:** Redirect to `/thank-you?lead_id=...&recommended_package_slug=...`.

### STEP 4 — System creates lead

- Lead is in Supabase `leads`; optional row in `bookings` if package was selected.
- **Verify:** Note the `lead_id` from the thank-you page or URL.

### STEP 5 — Admin reviews the lead

- Open `/login` (or `/signin`). Sign in as **admin**.
- Go to **Leads**, open the lead you just created.

### STEP 6 — Admin recommends a package

- On the lead detail page, use **Recommend package**: choose a dental tourism package (e.g. Medellín or Manizales).
- Save. Deposit amount shown updates to that package’s deposit.

### STEP 7 — Admin triggers Stripe deposit

- In the **Stripe deposit** section, click **Collect deposit**.
- **Result:** Redirect to Stripe Checkout.

### STEP 8 — Patient pays with test card

- On Stripe Checkout use test card: **4242 4242 4242 4242**.
- Expiry: any future (e.g. 12/34), CVC: any (e.g. 123).
- Complete payment.
- **Result:** Redirect back to admin lead page with `?paid=1` (or patient dashboard if patient paid).

### STEP 9 — Patient dashboard shows travel package

- **Option A — Patient paid:** If the lead’s email has a patient account, log in at `/login` with that email → **Patient dashboard** (`/patient`). You should see **Your travel package** (name, deposit, link) and the assessment with **Pay deposit** or “Deposit paid”.
- **Option B — Admin collected:** Patient can still sign up at `/signup` with the **same email** as the lead, then log in and go to `/patient`. The dashboard shows the same lead and **Your travel package** card.

---

## Roles (supported)

- **Patient:** Sign up at `/signup`, login at `/login` → `/patient`. Sees own assessments, recommended package, Pay deposit.
- **Admin:** Login → `/admin`. Leads, recommend package, collect deposit, providers, specialists, experiences.
- **Specialist:** Login (account created by admin) → `/specialist`. Consultations.
- **Provider:** Login (account created by admin) → `/provider`. Own provider data.
- **Coordinator:** Login (account created by admin) → `/coordinator`. Leads, bookings, consultations.

---

## Packages (demo)

Packages can include dental clinic, hotel, airport transfer, tourism experiences, Medellín, Manizales (or both). Ensure at least one published package exists (e.g. run `scripts/seed_packages.sql` or `scripts/seed_marketplace_foundation.sql` after migrations).

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| Lead not in admin | Confirm POST `/api/leads` returned 201 and note `lead_id`. |
| Collect deposit wrong amount | Admin must **recommend a package** first; deposit is taken from recommended (or form) package. |
| Webhook not updating | `STRIPE_WEBHOOK_SECRET` in env; webhook URL `/api/stripe/webhook`; redeploy after adding secret. |
| Patient dashboard empty | Patient must use the **same email** as the lead. Create account at `/signup` if needed. |
