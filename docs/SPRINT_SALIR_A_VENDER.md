# Sprint: Salir a vender — Página profesional

**Objetivo:** Dejar la landing y el flujo listos para vender con aspecto **profesional**. Cualquier agente debe poder ejecutar las tareas de este documento en orden.

**Regla:** Al terminar cada tarea, marcar [x] en [NEXT_TASKS.md](NEXT_TASKS.md) (sección "Sprint: Salir a vender"). Al final, `npm run verify` y `./scripts/deploy_verify.sh <URL>` deben pasar.

---

## Checklist ejecutable por agentes

### 1. Código y deploy

| # | Tarea | Agente | Criterios |
|---|--------|--------|-----------|
| S1 | Ejecutar `npm run verify`. Si falla, corregir. | Cualquiera | Exit 0. |
| S2 | Ejecutar `./scripts/deploy_verify.sh https://smile-transformation-platform-dev.vercel.app`. Si falla, corregir. | Cualquiera | PASSED. |

### 2. Página profesional (landing)

| # | Tarea | Agente | Criterios |
|---|--------|--------|-----------|
| S3 | Revisar copy de la landing: títulos, barra superior, hero, FAQ, footer. Sin typos; tono claro y profesional. Corregir si hay algo evidente. | Frontend | Textos coherentes, sin errores ortográficos. |
| S4 | Favicon: añadir `app/icon.png` o `public/favicon.ico` (Next.js usa `app/icon.png` por defecto si existe). Si no hay asset, documentar en README que se puede añadir. | Frontend/Repo | Pestaña del navegador no muestra favicon genérico o está documentado. |
| S5 | Footer: añadir cuarta columna "Legal" con enlace a `/legal` o placeholder "Privacy" que apunte a una ruta (puede ser página estática mínima o "#" con texto "Privacy — coming soon"). Dejar la página con aspecto completo. | Frontend | Footer con 4 columnas; enlace Legal/Privacy presente. |
| S6 | Responsive: revisar en viewport móvil que la barra sticky inferior no tape contenido crítico; que el header y los CTAs sean tocables (min touch target ~44px). Ajustar padding/espaciado si hace falta. | Frontend | Sin solapamientos graves; botones fáciles de tocar en móvil. |
| S7 | Accesibilidad básica: contraste texto/fondo suficiente; enlaces y botones con focus visible (outline o ring). Revisar que imágenes tengan alt. | Frontend | No regresiones; focus visible en navegación por teclado. |
| S8 | Barra superior (announcement): asegurar que el enlace "Start free" sea visible y que en móvil la barra no ocupe demasiado (una o dos líneas). | Frontend | Legible en móvil y desktop. |

### 3. Cierre del sprint

| # | Tarea | Agente | Criterios |
|---|--------|--------|-----------|
| S9 | Ejecutar de nuevo `npm run verify` y `deploy_verify.sh`. Actualizar NEXT_TASKS.md marcando todas las tareas S1–S9 del sprint. | Repo/QA | Verify OK; NEXT_TASKS actualizado. |
| S10 | En STATUS.md, en el track Deploy, añadir una línea: "Sprint Salir a vender: checklist página profesional ejecutado (fecha)." | Repo | STATUS.md actualizado. |

---

## Briefing para pegar a un agente

Copia y pega esto al abrir una sesión con un agente:

```
Eres un agente del proyecto Nebula Smile. Objetivo: ejecutar el sprint "Salir a vender" para dejar la página profesional y lista para vender.

1. Lee AGENTS.md y docs/SPRINT_SALIR_A_VENDER.md.
2. Ejecuta las tareas del sprint en orden (S1 → S10). Marca cada tarea en docs/NEXT_TASKS.md (sección "Sprint: Salir a vender") cuando la completes.
3. Reglas: npm run verify debe pasar al final. No introducir nuevos frameworks. Stack: Next.js 16, TypeScript, Tailwind, Supabase, Stripe, Vercel.
4. Si una tarea requiere humano (ej. subir favicon custom), documéntala y sigue con la siguiente.
5. Al terminar, deja actualizados NEXT_TASKS.md y STATUS.md.
```

---

## Referencias

- [NEXT_TASKS.md](NEXT_TASKS.md) — lista de tareas (marcar [x] al completar).
- [PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md](PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md) — plan maestro.
- [REFERENCIA_THE_EDGE.md](REFERENCIA_THE_EDGE.md) — mejoras de conversión ya aplicadas (barra arriba, CTA sticky, urgencia suave).
