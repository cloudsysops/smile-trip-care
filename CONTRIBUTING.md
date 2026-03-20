# Contributing — MedVoyage Smile

Este repositorio es el **producto canónico** de Smile / MedVoyage.

## Flujo básico

1. **Crear rama**
   - `feature/<descripcion>`
   - `fix/<descripcion>`

2. **Implementar cambios** siguiendo los estándares de código existentes.

3. **Antes del PR ejecutar**
   ```bash
   npm run verify
   ```
   (lint + tests + build).

4. **Revisar secrets**
   - No añadir `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY` ni otros secrets en código, commits ni logs.

5. **Abrir Pull Request**
   - Hacia `main` (o rama de destino definida).
   - Usar la plantilla de PR y rellenar checklist.

6. **CI en verde**
   - No hacer merge con CI en rojo.

## Regla importante: reuse-first

Antes de implementar algo nuevo:

1. Buscar en `docs/` (especialmente `ARCHITECTURE.md`, `PRODUCT_PLATFORM_STRATEGY.md`, `QA_RELEASE_PLAYBOOK.md`).
2. Buscar en el código existente (componentes, helpers, APIs).
3. Confirmar que la lógica no existe ya o que no hay un patrón reutilizable razonable.

Preferir **reutilizar** antes que duplicar.

## Documentos clave

- `DEFINITION_OF_READY.md` — cuándo una tarea está lista.
- `DEFINITION_OF_DONE.md` — cuándo un cambio está realmente terminado.
- `docs/NEXT_TASKS.md`
- `docs/PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md`
- `docs/QA_RELEASE_PLAYBOOK.md`
- `docs/ENGINEERING_WORKFLOW.md`

## Más detalles

- Cómo trabajar con ramas y GitHub: [docs/GIT_AND_GITHUB_WORKFLOW.md](docs/GIT_AND_GITHUB_WORKFLOW.md).
- Para temas de seguridad: [SECURITY.md](SECURITY.md).

