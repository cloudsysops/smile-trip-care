# Vercel: un solo proyecto (dev)

## Situación actual

Solo hay **un proyecto** en Vercel para este repo:

- **Nombre del proyecto:** termina en `-dev` (ej. `smile-transformation-platform-dev`).
- **URL:** https://smile-transformation-platform-dev.vercel.app

No hay segundo proyecto (por ejemplo uno “production” sin `-dev`). Todo el deploy va a esa única URL.

## Rama y despliegue

- **Rama de producción en Vercel:** debe estar en **`main`** (Settings → Git → Production Branch).
- **Push a `main`** → Vercel construye y despliega a https://smile-transformation-platform-dev.vercel.app

## Referencias en docs y scripts

En la documentación y en los scripts se usa esta URL como la única de deploy. Si en el futuro se añade un segundo proyecto (p. ej. producción con dominio propio), se actualizará este doc y los checklists.

**Última revisión:** 2026-03 — un solo proyecto Vercel, URL `-dev`.
