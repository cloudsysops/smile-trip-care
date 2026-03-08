# CTO Full Audit — Nebula Smile (March 2026)

**Scope:** Repository state, production readiness, next revenue module, AI agents, API/security, landing/conversion, deployment.  
**Deploy target:** Single Vercel project (-dev); branch `main`. [VERCEL_UN_SOLO_PROYECTO.md](VERCEL_UN_SOLO_PROYECTO.md)

---

## 1. Executive summary

| Area | Status | Priority |
|------|--------|----------|
| **Missing production features** | Gaps listed in §2 | P1: E2E + webhook test; P2: rate limit (Upstash); P3: 0001–0003 migrations in repo |
| **Next revenue module** | **Assessment intent & qualification** (§3) | Implement in branch; DB already supports it |
| **AI agents** | Solid trigger/queue design; improvements in §4 | Observability, prompts, retries |
| **API / security** | Good baseline; hardening in §5 | Strict schema, UUID validation, Upstash |
| **Landing / mobile** | Good structure; conversion/mobile in §6 | Placeholders → real content; touch targets |
| **Production deployment** | Checklist and env in §7 | Complete DEPLOY_CHECKLIST; verify env |

---

## 2. Missing production features

### 2.1 Must-have before “production ready”

- **Full E2E flow not signed off:** Assessment → thank-you → admin signin → Collect deposit → Stripe 4242 → confirm payment/lead in DB. Document in DEPLOY_CHECKLIST / CHECKLIST_PRIMERA_VENTA and mark done after one successful run.
- **Stripe webhook test in production:** “Send test” from Stripe Dashboard to production URL; confirm 200 and no errors in Vercel logs.
- **Cron secret in Vercel:** `AUTOMATION_CRON_SECRET` or `CRON_SECRET` set so followups/worker/outbound-worker run.

### 2.2 Should-have

- **Rate limit for production:** In-memory limit does not span Vercel instances. Set `RATE_LIMIT_PROVIDER=upstash` and `UPSTASH_*` env for production.
- **Migrations 0001–0003:** Not in repo (init, assets extended, M9 AI). New environments need them; add to repo or document “apply from backup/legacy” and keep 0004–0018 as-is.

### 2.3 Nice-to-have

- **Lead schema `.strict()`:** Reject unknown keys in POST body (Zod `.strict()` on LeadCreateSchema).
- **Admin lead `[id]`:** Validate UUID before DB call in admin leads detail and related routes.
- **E2E tests:** Playwright/Cypress for critical path (assessment → thank-you, admin deposit flow).

---

## 3. Next module to increase revenue: Assessment intent & qualification

**Goal:** Capture intent and qualification on the assessment form so sales can prioritize and personalize. Higher-quality leads and better routing → higher close rate.

**Why this module:**

- API and DB **already support** `travel_companions`, `budget_range`, `specialist_ids`, `experience_ids` (migrations 0013, 0017; LeadCreateSchema and POST /api/leads).
- The **form does not collect** them today. Adding optional fields is low risk and high value.
- No new backend contract; only form + request body alignment.

**Implementation (done in branch):**

1. **DB:** No new migration required. Optional: add indexes on `leads(budget_range)`, `leads(travel_companions)` for admin filters (migration 0019 in branch).
2. **Assessment form:**
   - **Travel companions:** Optional dropdown (e.g. Solo, Partner, Family, Group).
   - **Budget range:** Optional dropdown (e.g. Under $3k, $3k–5k, $5k–10k, $10k+).
   - **Specialists / experiences:** Optional multi-select from published specialists and experiences (server-loaded on assessment page).
3. **Landing:** Small conversion tweak (e.g. trust line or CTA near “Start Free Evaluation”).
4. **Admin:** Lead detail already shows attribution; ensure travel_companions and budget_range are visible in admin lead detail if columns exist.

**Success metrics:** % of leads with budget_range and/or travel_companions filled; time-to-respond and close rate by segment.

---

## 4. AI agents audit and improvements

### 4.1 Current design (good)

- **Triggers:** lead_created → lead-triage + sales-responder; deposit_paid → itinerary-generator + ops-coordinator; cron 24h/48h → sales-responder.
- **Queue:** `ai_automation_jobs` with statuses, lock, retries, dead_letter; idempotency on (lead_id, trigger_type, job_type).
- **Safety:** No medical advice in prompts; Zod validation; failures not exposed to client.
- **Operational:** Secret-protected worker and followups; Vercel crons configured.

### 4.2 Proposed improvements

| Improvement | Benefit |
|-------------|---------|
| **Structured logging / observability** | Log job_type, lead_id, attempt, duration, and outcome (success/fail/dead_letter) to a single stream (e.g. JSON logs) for debugging and dashboards. |
| **Prompt versioning** | Store prompt version or hash in `lead_ai` or job metadata so replies can be attributed to a prompt set (A/B or rollback). |
| **Retry tuning** | Make max_attempts and backoff configurable per job_type (e.g. sales-responder 3 attempts, itinerary 2). |
| **Marketing-content agent** | Implement planned “marketing-content” agent for landing/email copy variants if ROI is clear. |
| **Reply tone A/B** | Optional flag or segment to test “warmer” vs “professional” reply tone and measure conversion. |

---

## 5. Backend API architecture and security

### 5.1 Current state

- **Auth:** Supabase Auth + cookies; `getCurrentUser` / `getCurrentProfile`; requireAdmin() and role checks on admin and AI routes.
- **Validation:** Zod on body/params; Stripe webhook raw body + signature.
- **Rate limit:** 10/min per IP on POST /api/leads; in-memory by default.
- **Workers:** Secret header/Bearer for automation and outbound.
- **Errors:** request_id, generic client messages, server logging.

### 5.2 Recommended improvements

- **LeadCreateSchema:** Add `.strict()` so extra keys are rejected (clearer contract, no silent strip).
- **Admin routes with `[id]`:** Validate path param as UUID (e.g. RouteIdParamSchema) before any DB call; return 400 for invalid id.
- **Production rate limit:** Use Upstash (RATE_LIMIT_PROVIDER=upstash) so limit is shared across instances.
- **CORS:** If adding non–same-origin frontends, document and restrict CORS in Next.js config or middleware.
- **Audit log (optional):** Log admin actions (who, what, when) for compliance; can be append-only table or external.

---

## 6. Landing page conversion and mobile UX

### 6.1 Current state

- **Sections:** Announcement bar, hero, trust, packages, specialists, experiences, Why Medellín + Manizales, partners, testimonials, FAQ, CTAs.
- **CTAs:** “Start Free Evaluation”, “View Packages”, WhatsApp; links to `/assessment` and `/#packages`.
- **Components:** PackageCard, SpecialistCard, ExperienceCard, StepFlowSection, PartnerInstitutionCard; some image placeholders.

### 6.2 Recommended improvements

- **Conversion:** Add one short trust line above or next to primary CTA (e.g. “No commitment · Answer in 24h”). Reduce friction on assessment entry (e.g. “3 steps” or “Takes 2 min”).
- **Mobile:** Ensure touch targets ≥ 44px; test sticky CTA on small viewports; check font size and contrast (accessibility).
- **Content:** Replace remaining placeholders with real copy or approved assets; add meta/OG tags for sharing.
- **Performance:** Lazy-load below-the-fold sections or images if LCP is an issue; keep critical CSS minimal.

---

## 7. Production deployment readiness

### 7.1 Checklist (align with DEPLOY_CHECKLIST)

- [ ] **Env (Vercel):** SUPABASE_*, STRIPE_*, NEXT_PUBLIC_*; AUTOMATION_CRON_SECRET or CRON_SECRET; optional OPENAI_*, UPSTASH_*.
- [ ] **Stripe:** Webhook endpoint = production URL `/api/stripe/webhook`; event `checkout.session.completed`; STRIPE_WEBHOOK_SECRET set; one “Send test” success.
- [ ] **Migrations:** 0001–0018 applied on production DB (or 0004–0018 if 0001–0003 applied elsewhere).
- [ ] **Verify:** `npm run verify` green; `./scripts/deploy_verify.sh <URL>` 200 on / and /api/health.
- [ ] **E2E:** One full run: assessment → thank-you → admin → deposit → Stripe 4242 → DB check; document and mark in CHECKLIST_PRIMERA_VENTA.
- [ ] **Branch:** Vercel Production Branch = `main`; single project (-dev) documented.

### 7.2 Runbooks

- Keep SAFE_REDEPLOY_CHECKLIST and VERCEL_PRODUCCION_NO_ACTUALIZA updated (single project, main).
- Document how to run migrations for new env (npm run db:migrate or Supabase CLI).
- Document how to test webhook and cron endpoints (curl + secret header).

---

## 8. Summary table

| Question | Answer |
|----------|--------|
| Missing production features? | E2E + webhook test; cron secret; rate limit (Upstash); 0001–0003 in repo or documented. |
| Next module for revenue? | **Assessment intent & qualification** (travel_companions, budget_range, optional specialists/experiences on form). |
| AI agents improvements? | Observability, prompt versioning, retry tuning, optional marketing-content agent. |
| API/security improvements? | Strict lead schema, UUID validation on admin [id], Upstash for prod rate limit. |
| Landing/mobile? | Trust line near CTA, mobile touch targets, replace placeholders, meta/OG. |
| Production deployment? | Complete DEPLOY_CHECKLIST; env and webhook verified; one E2E run documented. |

---

*Audit date: March 2026. Next review: after Assessment intent module merge and production checklist completion.*
