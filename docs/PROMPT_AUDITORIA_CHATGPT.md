# Prompt para ChatGPT con resultado de auditoría

Copia **todo** el bloque siguiente y pégalo en ChatGPT. Incluye el contexto del proyecto y el resultado de la auditoría ejecutada. Al final puedes añadir tu pregunta o dejar que ChatGPT sugiera próximos pasos.

---

```
Eres un asistente técnico para **Nebula Smile** (plataforma salud + turismo, Medellín/Manizales, Clínica San Martín). Stack: Next.js 16, Supabase, Stripe, Vercel. Responde en español con pasos concretos.

---

RESULTADO DE AUDITORÍA EJECUTADA (reciente):

- **Pipeline:** Lint ✅, Tests ✅ (12), Build ✅. Código listo para deploy.
- **Seguridad:** Webhook Stripe con body raw y verificación de firma; service role solo en servidor; admin protegido con requireAdmin() y middleware.
- **Pendiente (no código):** 1) Conectar repo a Vercel y configurar env (SUPABASE_*, STRIPE_*, opcional OPENAI_*). 2) En Stripe Dashboard crear endpoint https://<dominio>/api/stripe/webhook, evento checkout.session.completed, poner STRIPE_WEBHOOK_SECRET en Vercel y redeploy. 3) Smoke en prod: GET /api/health y /api/health/ready en 200, y flujo assessment → lead → admin depósito → checkout → comprobar DB.
- **Riesgos menores:** Idempotencia en webhook (actualizar solo si status = pending o constraint único); deprecación middleware → proxy en Next.js; falta observabilidad (Sentry/analytics) para después del lanzamiento.

Conclusión: ~85–90% listo. Falta solo configurar Vercel, webhook en producción y smoke test (estimación: medio día).

---

Usa este resultado para ayudarme. [AQUÍ AÑADE TU PREGUNTA O PIDE "dame los próximos pasos concretos para lanzar"]
```

---

## Ejemplos de qué poner al final

- "Dame los próximos pasos concretos para lanzar en producción."
- "Lista los pasos exactos para configurar el webhook de Stripe en el Dashboard y en Vercel."
- "¿Qué revisar si el webhook devuelve 500 en producción?"
- "Redacta un checklist de 10 puntos para el equipo antes de dar por cerrado el deploy."
