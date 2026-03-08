# Orden de migraciones

Aplicar en orden lexicográfico (0001 → 0002 → … → 0018). Desde la raíz del proyecto:

```bash
npm run db:migrate
```

O en Supabase SQL Editor, ejecutar en este orden:

1. 0001_init.sql  
2. 0002_assets_extended_unified.sql  
3. 0003_m9_ai_admin_connected.sql  
4. 0004_leads_attribution.sql  
5. 0005_lead_ai_ops.sql  
6. 0006_leads_follow_up_queue.sql  
7. 0007_payments_idempotency.sql  
8. 0008_ai_automation_foundation.sql  
9. 0009_ai_automation_jobs.sql  
10. 0010_outbound_messages.sql  
11. 0011_payment_reliability.sql  
12. 0012_payments_idempotency_m19.sql  
13. 0013_specialists_consultations_experiences.sql  
14. 0014_marketplace_providers_packages_experiences.sql  
15. 0015_marketplace_foundation.sql  
16. 0016_curated_network_providers_specialists.sql  
17. 0017_curated_network_enterprise.sql  
18. 0018_profiles_roles_dashboards.sql  
19. 0019_leads_qualification_indexes.sql  

Luego opcional: `scripts/seed_packages.sql`, `scripts/seed_marketplace_foundation.sql`.

**Si ya aplicaste migraciones con nombres antiguos** (p. ej. 0009_curated_network_providers_specialists), usa `npx supabase migration repair <nombre_antiguo> --status applied` para marcar como aplicadas y evitar duplicados.
