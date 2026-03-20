# MedVoyage Smile — Hotfix Template

You are working inside the MedVoyage Smile repository.

Before doing anything, read and follow:

- `.cursor/rules/core.mdc`
- `.cursor/rules/safe-changes.mdc`
- relevant agent profile from `.cursor/agents/`

---

## Hotfix Goal

[Describe the production issue in 1–2 sentences]

Examples:
- Fix broken route after merge
- Fix incorrect CTA link
- Fix visual regression on proposal page
- Fix production-only metadata issue

---

## Severity

Choose one:

- **P0** — production broken / payments / auth / major outage
- **P1** — important user-facing regression
- **P2** — minor bug or polish
- **P3** — non-urgent cleanup

---

## Risk Classification

You must begin with:

- **SAFE**
- **MODERATE**
- **SENSITIVE**

If the hotfix touches any of these, stop unless explicitly approved:

- Stripe
- Supabase schema
- migrations
- auth core logic
- webhook logic
- RLS
- production-critical API contracts

---

## Required Flow

1. Audit the issue
2. Identify exact root cause
3. List exact files likely affected
4. Propose the smallest possible fix
5. Implement only the minimum fix
6. Run verification
7. Open PR
8. Wait for founder approval unless explicitly told to merge

Never broaden the scope of a hotfix.

---

## Audit Format

Before implementing, output:

### 1. Problem summary
What is broken?

### 2. Root cause hypothesis
Why is it happening?

### 3. Files likely affected
Exact file list only.

### 4. Smallest safe fix
What is the minimum change to resolve it?

### 5. Risk classification
SAFE / MODERATE / SENSITIVE

Do not implement before providing this.

---

## Implementation Rules

- Fix only the reported issue
- No opportunistic refactors
- No unrelated cleanup
- No copy/design changes unless directly required
- Preserve current production behavior everywhere else

---

## Verification

Always run:

```bash
npm run verify
```

If relevant, also run:

```bash
./scripts/qa/smoke_routes.sh
```

If production parity matters, also run:

```bash
./scripts/devops/compare_local_vs_prod.sh
```

⸻

### PR Workflow

Branch naming:

`hotfix/<short-description>`

Examples:
- `hotfix/proposal-cta-link`
- `hotfix/signup-metadata`
- `hotfix/packages-404`

Final output must include:

**Hotfix Summary**

**Files Changed**

**Verification Result**

**Risk Classification**

**PR Link**

**Manual Follow-up Needed**

