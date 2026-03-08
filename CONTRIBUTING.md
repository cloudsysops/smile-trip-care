# Cómo contribuir — Nebula Smile

Gracias por contribuir. Sigue estas pautas para mantener el flujo claro y el código alineado con el resto del equipo.

## Antes de empezar

- Revisa [README.md](README.md) para arrancar el proyecto en local.
- Revisa [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) para el modelo de ramas (feature → main o dev/staging/main según configuración).
- Revisa [docs/GITHUB_ENTERPRISE_SETUP.md](docs/GITHUB_ENTERPRISE_SETUP.md) para la configuración de GitHub y protección de ramas.

## Flujo de trabajo

1. **Crea una rama** desde `main` (o desde `dev` si usas flujo completo):
   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b feature/nombre-descriptivo
   ```

2. **Desarrolla** con commits atómicos y mensajes claros (ej. `feat: ...`, `fix: ...`, `docs: ...`).

3. **Verifica en local** antes de abrir el PR:
   ```bash
   npm run verify
   ```
   (lint + tests + build).

4. **Abre un Pull Request** hacia `main` (o hacia `dev` si aplica). Usa la plantilla de PR y rellena checklist.

5. **CI** debe estar en verde (lint, test, build). No se hace merge con CI en rojo.

6. **Review** según la política del equipo (ej. 1 aprobación para `main`).

7. **Merge** (squash o merge commit según política del repo). Borra la rama tras el merge.

## Estándares de código

- **TypeScript/React:** Estilo coherente con el resto del proyecto; ESLint sin errores.
- **Tests:** Nuevas funcionalidades críticas con tests cuando sea razonable; no romper tests existentes.
- **Migraciones:** Cualquier cambio de esquema en `supabase/migrations/` con nombre secuencial y actualización de `MIGRATION_ORDER.md`.
- **Secrets:** Nunca en el código; solo variables de entorno y referencias en `.env.example` (sin valores reales).

## Documentación

- Actualiza README, STATUS.md o docs relevantes si cambias comportamiento público, scripts o pasos de despliegue.
- Los agentes (Cursor, etc.) siguen [AGENTS.md](AGENTS.md) y las reglas en `.cursor/`.

## Dudas

- Abre un **issue** para preguntas de diseño o proceso.
- Para vulnerabilidades, sigue [SECURITY.md](SECURITY.md).
