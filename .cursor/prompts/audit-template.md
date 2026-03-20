# MedVoyage Smile — Audit Template

You are auditing MedVoyage Smile.

This is an audit-only task.  
Do not change code unless explicitly requested.

Before starting, read:

- `.cursor/rules/core.mdc`
- `.cursor/rules/safe-changes.mdc`
- relevant agent file from `.cursor/agents/`

---

## Audit Goal

[Describe what is being audited]

Examples:
- backend readiness
- conversion funnel
- enterprise readiness
- security and access
- production parity
- SEO readiness

---

## Audit Scope

Select all that apply:

- [ ] frontend / UX
- [ ] backend / APIs
- [ ] auth / roles
- [ ] payments / Stripe
- [ ] Supabase / data layer
- [ ] operations / docs
- [ ] devops / deploy
- [ ] CRO / growth
- [ ] legal / compliance
- [ ] SEO / content

---

## Risk Rules

Every audit must classify findings as:

- **SAFE**
- **MODERATE**
- **SENSITIVE**

Definitions:

### SAFE
Low-risk improvements or observations with no impact on core systems.

### MODERATE
Important issues affecting operations, flow, or maintainability, but not immediately dangerous.

### SENSITIVE
Anything involving:
- Stripe
- auth
- migrations
- schema
- webhook behavior
- RLS
- compliance / legal exposure
- production data risk

---

## Required Output Format

### A. Executive Summary
Short, direct summary of the current state.

### B. Current Strengths
What is already solid?

### C. Main Risks / Weaknesses
What is weak, broken, or risky?

### D. Findings by Area
For each audited area:
- current state
- risks
- priority

### E. SAFE Recommendations
Low-risk changes worth doing.

### F. MODERATE Recommendations
Important but controlled changes.

### G. SENSITIVE Recommendations
Changes that require explicit approval or cross-functional review.

### H. Minimum High-Impact Plan
What is the smallest roadmap with the biggest value?

### I. Suggested Sprint Breakdown
If useful, break recommendations into 2–4 sprints.

### J. Final Verdict
Is the system:
- ready
- partially ready
- not ready
for the audited goal?

---

## Audit Principles

- Be specific
- Be practical
- Avoid generic advice
- Focus on business impact, risk, and execution
- Distinguish clearly between “must fix now” and “can wait”
- Do not over-engineer the roadmap

---

## Final Rule

An audit is useful only if it helps the founder decide:
- what to do now
- what not to touch
- what is risky
- what creates the most value

