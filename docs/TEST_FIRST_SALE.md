# First sale: step-by-step (no code)

Use this to run a full test sale from lead to deposit. Anyone on the team can follow it without reading code.

---

## Before you start

- The app is deployed (e.g. your Vercel URL).
- You have one admin user (email + password in Supabase Auth).
- Stripe and Supabase are connected (env vars set; webhook configured for `checkout.session.completed`).

---

## Step 1 — Create a lead (as a “patient”)

1. Open the **landing page** (e.g. your app URL).
2. Click **Start Free Smile Evaluation** (or **View Packages** → pick a package → start from there).
3. Fill the form: first name, last name, email (required). Optionally add phone, country, package, message.
4. Submit.
5. You should land on **Thank you** with a reference. If you chose a package, you’ll see it mentioned.
6. **Optional:** Sign up at **/signup** with the same email; then in **/patient** you can pay the deposit yourself.

---

## Step 2 — Open admin and find the lead

1. Go to **/admin/login** (or /signin).
2. Log in with the admin account.
3. Open **Leads**. Find the lead you just created (same name/email, recent time).
4. In the **Next action** column you’ll see either **Ready to recommend package** or **Ready to collect deposit**.
5. Click the lead to open the **lead detail** page. At the top you’ll see:
   - **Lead status** (e.g. new, qualified, deposit_paid).
   - **Package** — from the form or your recommendation.
   - **Deposit** — button to collect the deposit when the lead is ready.

---

## Step 3 — Recommend a package (if needed) and collect deposit

**As admin:**

1. If the lead has no recommended package yet, scroll to **Recommend package**, choose a package (e.g. Essential Care Journey), and click **Save recommendation**.
2. At the top, in the **Deposit** section, click **Collect deposit**. You’ll be sent to Stripe Checkout. The amount comes from the lead’s recommended package (or from the form if you didn’t set one).

**As patient (optional):** If the lead’s email has a patient account, log in, go to **/patient**, and in “Your assessments” click **Pay deposit** for that lead.

---

## Step 4 — Pay with Stripe test card

1. On Stripe Checkout use the test card: **4242 4242 4242 4242**.
2. Any future expiry (e.g. 12/34) and any CVC (e.g. 123).
3. Complete the payment.
4. You should return to the app (e.g. lead detail with `?paid=1`) and see a success message (e.g. “Deposit registered successfully”).

---

## Step 5 — Confirm in Supabase (optional)

1. In **Supabase** → your project → **Table Editor**.
2. **payments** — find the row for this lead; `status` should be **succeeded**.
3. **leads** — open the lead; `status` should be **deposit_paid**.

---

## Step 6 — Confirm in admin

1. Open the same lead again (or refresh the lead detail page).
2. Lead status should show **deposit_paid**.
3. The deposit section should show that the deposit is paid (button gone or disabled).

---

## If something goes wrong

| What you see | What to check |
|--------------|----------------|
| Lead doesn’t appear in admin | Form submitted successfully? Try again and check you get to the Thank you page. |
| “Collect deposit” does nothing | Are you logged in as admin? Try logging out and back in. |
| Stripe checkout fails | Ask whoever set up the app: Stripe keys (STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) must be set in Vercel. |
| Payment doesn’t update lead to deposit_paid | Webhook may be missing or wrong. Ask devops: STRIPE_WEBHOOK_SECRET in Vercel; webhook URL must be `https://<your-domain>/api/stripe/webhook` for event `checkout.session.completed`; redeploy after adding the secret. |

Optional: In Stripe Dashboard → Developers → Webhooks, the event for this payment should show response **200**.
