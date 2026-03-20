# Definition of Done (DoD)

Un cambio está **Done** cuando puede desplegarse sin romper el funnel principal:

Assessment → Lead → Admin → Contacto → Pago

Y cumple TODO lo siguiente.

## Código
- Implementación completa según la historia o tarea.
- No introduce duplicación innecesaria.
- Reutiliza componentes, helpers o lógica existente cuando aplica.

## Verificación
- `npm run verify` ejecutado y en verde (lint + tests + build).
- Tests existentes pasan.
- Si el cambio toca flujos críticos (assessment, leads, pagos, admin visibility), se revisa manualmente el flujo impactado.

## Seguridad
- No se exponen secrets (API keys, service role, Stripe keys, etc.).
- Entradas externas validadas (Zod u otra validación central).
- Logs útiles para debugging sin filtrar datos sensibles.

## Documentación
- Si cambia comportamiento relevante (funnel, admin, pagos, AI, deploy), se actualizan los docs relacionados en `docs/` (por ejemplo: `ARCHITECTURE.md`, `QA_RELEASE_PLAYBOOK.md`, `ENV_Y_STRIPE.md`, etc.).

## Deploy
- El cambio es compatible con el entorno actual (Supabase, Stripe, Vercel).
- No rompe los flujos existentes conocidos (assessment → thank-you, leads en admin, checkout + webhook).

