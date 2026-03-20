# MedVoyage Smile — Sprint Execution Template

You are working inside the MedVoyage Smile repository.

Before doing anything, read and follow:

- `.cursor/rules/core.mdc`
- `.cursor/rules/safe-changes.mdc`
- `.cursor/rules/pr-workflow.mdc` (if present)
- relevant agent profile from `.cursor/agents/`

---

## Sprint Goal

[Describe the sprint in 1–3 sentences]

Examples:
- Improve conversion in the assessment flow
- Add low-risk trust and UX improvements
- Harden enterprise-readiness without touching sensitive systems
- Improve operations and founder usability

---

## Business Objective

What business outcome should this sprint improve?

Examples:
- increase assessment completion
- increase WhatsApp conversations
- reduce operator confusion
- improve patient trust
- prepare for first real sale
- improve investor demo quality

---

## Scope

Allowed scope for this sprint:

- [ ] frontend UI
- [ ] copy
- [ ] docs
- [ ] low-risk operational tooling
- [ ] QA scripts
- [ ] analytics readiness
- [ ] route-level UX improvements

Out of scope unless explicitly approved:

- [ ] Stripe logic
- [ ] Supabase schema
- [ ] migrations
- [ ] auth core logic
- [ ] API contract changes
- [ ] webhook rewrites
- [ ] production infra redesign

---

## Required Working Style

You must follow this sequence:

1. Audit first
2. Classify risk
3. Propose minimum high-impact plan
4. List exact files likely to change
5. Implement only approved scope
6. Run verification
7. Open PR
8. Wait for founder approval

Never push directly to `main`.

---

## Risk Classification

Every sprint response must begin with one of these:

- **SAFE**
- **MODERATE**
- **SENSITIVE**

Definitions:

### SAFE
Visual/UI/copy/docs changes with no meaningful impact on backend or data integrity.

### MODERATE
Changes that affect user flow, component structure, or operational behavior, but do not alter core backend contracts.

### SENSITIVE
Anything touching:
- payments
- auth
- database schema
- RLS
- webhooks
- production-critical API behavior

If the sprint becomes SENSITIVE, stop and request explicit founder approval before implementing.

---

## Required Audit Format

Before implementation, output:

### 1. Current state audit
- strengths
- weaknesses
- blockers
- assumptions
- likely impact

### 2. Risk classification
SAFE / MODERATE / SENSITIVE

### 3. Files likely affected
List exact files, not generic folders.

### 4. Minimum implementation plan
Smallest set of changes with highest value.

Do not implement before providing this.

---

## Implementation Rules

- Prefer the smallest change with the biggest business impact
- Keep components modular
- Reuse existing patterns and primitives
- Avoid unnecessary refactors
- Avoid introducing unstable dependencies
- Preserve current production behavior unless explicitly improving it
- If adding copy, make it premium, clear, trustworthy, and commercial

---

## Verification Requirements

After implementation, always run:

```bash
npm run verify
```

If relevant, also run:

```bash
./scripts/qa/smoke_routes.sh
./scripts/devops/compare_local_vs_prod.sh
```

If verification fails:
- stop
- explain why
- do not open PR until resolved

⸻

### PR Workflow

1. Create a branch using this pattern:

`feature/<short-sprint-name>`

Examples:
- `feature/sprint-2-conversion-engine`
- `feature/enterprise-hardening-sprint`
- `feature/seo-growth-pages`

2. Commit with clean messages  
3. Push branch  
4. Open PR  
5. Provide final summary

⸻

### Final Summary Format

After implementation, output exactly:

**Sprint Summary**
- what was implemented
- what was intentionally not touched

**Files Changed**
- list of changed files

**Verification**
- lint result
- test result
- build result
- verify result

**Risk**
- SAFE / MODERATE / SENSITIVE

**PR**
- branch name
- PR link

**Remaining Manual Tasks**
- domain
- env vars
- dashboard steps
- webhook setup
- business ops tasks
- anything founder must do manually

⸻

### Copy / Brand Guidance

Use the MedVoyage Smile voice:
- premium
- international
- trustworthy
- concierge-led
- medically credible
- conversion-aware

Avoid:
- fluff
- generic startup jargon
- overclaiming
- fake urgency unless backed by real business rules

⸻

If the task is conversion-related:

Prioritize:
1. trust
2. clarity
3. CTA quality
4. friction reduction
5. WhatsApp / coordinator intent
6. package/deposit confidence

⸻

If the task is operations-related:

Prioritize:
1. founder usability
2. admin clarity
3. docs quality
4. repeatable runbooks
5. low-risk automation

⸻

If the task is enterprise-readiness-related:

Prioritize:
1. legal/compliance clarity
2. auditability
3. data safety
4. test coverage
5. operational resiliency

⸻

### Final Rule

The purpose of every sprint is not “more code”.  
The purpose is:
- more trust
- more sales readiness
- more operational clarity
- less risk

---

## Cómo usarlo en Cursor

Cuando abras un sprint, pega algo como esto:

```text
Use .cursor/prompts/sprint-template.md

Sprint goal:
Improve conversion in the proposal flow without touching Stripe, Supabase schema, or auth.

Business objective:
Increase WhatsApp conversations and deposit intent after assessment.

Now perform the audit first, classify risk, list files likely affected, and propose the minimum high-impact implementation plan.
```

⸻

Mi recomendación:

Después de crear este archivo, crea también uno más corto:

`.cursor/prompts/hotfix-template.md`

para cambios rápidos de producción.

Si quieres, te redacto también el `hotfix-template.md` y el `audit-template.md` para completar el sistema.

