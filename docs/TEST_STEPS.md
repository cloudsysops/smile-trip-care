# Exact test steps (per module)

## M1 Foundation & CI
```bash
./scripts/verify_all.sh
# or: npm run lint && npm run build
```
- **Pass:** Exit 0; no errors.

---

## M2 Database & RLS
1. In Supabase Dashboard → SQL Editor, run contents of `supabase/migrations/0001_init.sql`.
2. Run contents of `scripts/seed_packages.sql`.
3. Table Editor → `packages`: 2 rows, `published = true`.

---

## M3 Landing
```bash
npm run dev
```
- Open http://localhost:3000 → see Medellín, Manizales, disclaimer, "Go to assessment".

---

## M4 Packages
- http://localhost:3000/packages/smile-medellin → package page (after M2 seed).
- http://localhost:3000/packages/invalid → 404.

---

## M5 Assessment + M5.1 /api/leads
1. http://localhost:3000/assessment → fill form, submit → redirect to `/thank-you?lead_id=...`.
2. **Curl (create lead):**
   ```bash
   curl -X POST http://localhost:3000/api/leads \
     -H "Content-Type: application/json" \
     -d '{"first_name":"Test","last_name":"User","email":"test@example.com"}'
   ```
   Expect: `{"lead_id":"<uuid>","request_id":"..."}`.
3. **Curl (honeypot – no insert):**
   ```bash
   curl -X POST http://localhost:3000/api/leads \
     -H "Content-Type: application/json" \
     -d '{"first_name":"A","last_name":"B","email":"b@b.com","company_website":"http://x"}'
   ```
   Expect: `{"ok":true,"request_id":"..."}`. No new row in `leads`.

---

## M6 Admin leads
1. http://localhost:3000/admin/leads → redirect to `/admin/login`.
2. Sign in (Supabase Auth user with `profiles.role = 'admin'`).
3. /admin/leads → list; click lead → /admin/leads/[id]; change status, Save.
4. **Curl (PATCH – use cookie from browser):**
   ```bash
   curl -X PATCH http://localhost:3000/api/admin/leads/<LEAD_ID> \
     -H "Content-Type: application/json" \
     -d '{"status":"contacted"}' \
     -b "sb-<project>-auth-token=..."
   ```
   Without valid admin session: 403.

---

## M7 Stripe deposit + webhook
1. From /admin/leads/[id], click "Collect deposit ($500)" → redirect to Stripe Checkout.
2. Use test card `4242 4242 4242 4242`; complete payment.
3. **Webhook (local):**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Set `STRIPE_WEBHOOK_SECRET=whsec_...` in `.env.local`, restart dev server. After payment, lead status → `deposit_paid`, payment → `succeeded`.

---

## M8 Admin assets manager
1. Sign in as admin and go to http://localhost:3000/admin/assets/new.
2. Upload a JPEG/PNG/WebP image with title, category, location, tags and alt text. Submit.
3. Confirm the success message and that the new asset appears in http://localhost:3000/admin/assets with `approved=false` and `published=false`.
4. Check that the image is **not** visible on the landing gallery or package pages yet.
5. From /admin/assets, toggle **Approved** and **Published** for that asset.
6. Refresh the landing page and the corresponding package page: the asset should now appear in the gallery.
7. Use the **Edit** action to change title/alt text/tags and Save; verify updates in the table.
8. Use **Delete** on an asset; confirm it disappears from the table and no longer appears on public pages.

---

## M9 AI agents (admin connected)
1. Add `OPENAI_API_KEY` in `.env.local` (optional: `OPENAI_MODEL`).
2. Ensure Supabase migration `supabase/migrations/0003_m9_ai_admin_connected.sql` is applied.
3. Start dev server:
   ```bash
   npm run dev
   ```
4. Sign in as admin and open `/admin/leads/[id]`.
5. Click:
   - `Generate Triage`
   - `Generate Reply`
   - `Generate Itinerary`
6. Validate UI:
   - triage panel shows priority/recommended city/questions
   - reply panel shows WhatsApp + Email with copy buttons
   - itinerary history shows latest first and Copy JSON works
7. Validate DB:
   - `lead_ai.triage_json` and `lead_ai.messages_json` populated
   - `itineraries.content_json` inserted with `lead_id` and `city`
8. Final check:
   ```bash
   npm run lint && npm run build
   ```

---

## Final local checklist (URLs + curl)
| # | Action | Expected |
|---|--------|----------|
| 1 | Open http://localhost:3000 | Landing |
| 2 | Open /packages/smile-medellin | Package page |
| 3 | Open /assessment, submit form | /thank-you?lead_id=... |
| 4 | `curl -X POST .../api/leads` (valid body) | 200, lead_id |
| 5 | Open /admin/login, sign in | /admin/leads |
| 6 | Open /admin/leads/[id], Collect deposit | Stripe Checkout → pay → webhook updates DB |
| 7 | /admin/assets + /admin/assets/new | Admin assets manager works as above |
| 8 | /admin/leads/[id], run AI buttons | Triage/reply/itinerary rendered and persisted |
| 9 | `npm run lint && npm run build` | Pass |
