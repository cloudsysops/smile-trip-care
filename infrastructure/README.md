# Infrastructure — Nebula Smile

Terraform and infrastructure-as-code for this project. **No resources are provisioned by default** — this directory provides structure and documentation only.

---

## Layout

```
infrastructure/
├── README.md           # This file
├── environments/
│   ├── dev/            # Dev environment (placeholder)
│   ├── staging/        # Staging environment (placeholder)
│   └── prod/           # Production environment (placeholder)
└── modules/            # Reusable modules (optional, add as needed)
```

---

## Prerequisites

- **Terraform** >= 1.0 (optional; only if you provision infra).
- **Cloud provider credentials** — not assumed. Configure via env or provider-specific auth (e.g. AWS profile, GCP service account).

---

## Usage (when ready)

1. **Initialize (per environment):**
   ```bash
   cd infrastructure/environments/dev
   terraform init
   ```

2. **Plan (no changes applied):**
   ```bash
   terraform plan
   ```

3. **Apply (only when explicitly approved):**
   ```bash
   terraform apply
   ```

---

## What lives where

- **Supabase:** Managed via Supabase Dashboard or Supabase CLI; not Terraform in this repo unless you add a Supabase provider module.
- **Vercel:** Deploy via Vercel Dashboard or `vercel` CLI; Terraform Vercel provider can be added later.
- **Stripe:** Configuration in Stripe Dashboard; no Terraform.

This structure is ready for adding provider configs (e.g. AWS, GCP) or Terraform Cloud when the team decides.

---

## Security

- Do not commit `.tfstate` or secrets. Use remote state (e.g. S3 + DynamoDB, Terraform Cloud) when provisioning.
- Use variables for sensitive values; inject via env or CI secrets.
