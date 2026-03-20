# E2E Testing — MedVoyage Smile

Automated end-to-end tests use **Playwright** to simulate the patient journey and detect broken UX, links, and conversion blockers.

## Environment

- **Default BASE_URL:** `https://smile-transformation-platform-dev.vercel.app`
- Override with `BASE_URL` or `PLAYWRIGHT_BASE_URL`:

```bash
BASE_URL=https://your-app.vercel.app npm run test:e2e
```

## Run tests

```bash
# Against default production URL
npm run test:e2e

# Against local (start app first: npm run build && npm start)
BASE_URL=http://localhost:3000 npm run test:e2e

# With UI (debug)
npm run test:e2e:ui
```

## Critical path test (test 0)

A single test runs the full conversion path in order:

**Landing → Assessment → Proposal → Signup → Patient dashboard**

It uses a unique email per run, submits the assessment, expects the proposal redirect, then signs up with the same email and asserts the patient dashboard loads. Use this test for CI or smoke checks against a deployed preview.

## What is tested

0. **Critical path** — Landing → assessment → proposal → signup → patient dashboard (one flow)
1. **Landing** — Hero text and CTA (Get My Free Treatment Plan / Start Free Smile Evaluation)
2. **Assessment** — Click CTA → assessment form loads (title, First name, Submit button)
3. **Assessment submit** — Fill form, submit → redirect to `/assessment/proposal?lead_id=...`
4. **Proposal page** — "Your Personalized Smile Preview", savings card, WhatsApp button
5. **Packages** — Package cards load (e.g. Comfort Recovery Journey)
6. **Signup** — Form present (Create patient account)
7. **Login** — Form present (Sign in)
8. **Signup → Login → Patient** — When `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` are set, create account, sign in, open `/patient`, verify treatment/overview section
9. **Key links** — `/assessment` and `/packages` links return 200
10. **Report** — UX issues written to `e2e-ux-issues.txt`

## Checks

- No console errors (tracked and reported)
- Critical links return 200
- Page load &lt; 3s tracked on landing (reported in UX issues if exceeded)
- CTAs and key elements visible

## Output

- **Pass/fail** — List reporter and exit code (0 = all passed, 1 = any failed)
- **Screenshots on failure** — In `test-results/`
- **HTML report** — `playwright-report/index.html` (open after run)
- **JSON results** — `e2e-results.json`
- **UX issues** — `e2e-ux-issues.txt` (when issues are detected)

## Optional: auth-dependent test (step 8)

To run the full signup → login → patient flow against an environment with Supabase auth:

```bash
E2E_TEST_EMAIL=your-test@example.com E2E_TEST_PASSWORD=YourPassword123 BASE_URL=https://smile-transformation-platform-dev.vercel.app npm run test:e2e
```

If auth is not configured or signup fails, step 8 records a UX issue and may still pass (redirect check is soft).

## CI

Add to your pipeline:

```yaml
- run: npm ci
- run: npx playwright install --with-deps chromium
- run: BASE_URL=${{ env.BASE_URL }} npm run test:e2e
```

Artifacts: `playwright-report/`, `test-results/`, `e2e-ux-issues.txt`, `e2e-results.json`.
