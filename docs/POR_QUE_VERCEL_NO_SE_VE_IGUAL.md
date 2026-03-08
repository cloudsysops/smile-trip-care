# Por qué Vercel no se ve igual que localhost

## Qué está pasando

- **En localhost** ves: hero con "Start Free Evaluation", "View Packages", "Chat on WhatsApp", "Why Medellín + Manizales", tarjetas de paquetes mejoradas, etc.
- **En Vercel** (https://smile-transformation-platform-dev.vercel.app/) se sirve una versión anterior: otro diseño (tema claro/oscuro distinto, header más simple).

**Causa:** Esos cambios de la landing (y el resto de lo nuevo) **no están en el commit que Vercel está usando**. Siguen solo en tu copia local:

- Archivos **modificados** (M): p. ej. `app/page.tsx`, `app/components/landing/package-card.tsx`, etc.
- Archivos **nuevos sin seguimiento** (??): login, dashboards, APIs admin, migraciones, docs, etc.

El deploy actual de Vercel se hace desde la rama conectada (p. ej. `main`). Si en local tenías cambios sin push, Vercel mostraba una versión anterior. **Actualizado 2026-03-08:** se hizo push de todo lo local a `main` (commit 2adc9af); Vercel debería desplegar esa versión en unos minutos.

## Qué hacer para que se vea igual

Hay que **subir tu versión actual** a la rama que Vercel usa (normalmente `production-hardening` o `main`):

```bash
cd smile-transformation-platform   # raíz del proyecto

# 1. Incluir todos los cambios (modificados + nuevos)
git add .

# 2. Crear un commit con todo
git commit -m "feat: landing upgrade, auth/roles, admin, dashboards - igual que local"

# 3. Subir la rama actual (production-hardening)
git push origin production-hardening
```

Después del push:

1. Si el proyecto de Vercel está conectado a la rama **production-hardening**, se lanzará un deploy nuevo y en unos minutos la URL tendrá la misma versión que local.
2. Si Vercel está conectado a **main**, tienes que hacer merge a `main` y push:
   ```bash
   git checkout main
   git merge production-hardening
   git push origin main
   ```

En Vercel: **Dashboard → tu proyecto → Settings → Git** para ver qué rama usa "Production" o "Preview".

## Comprobar después del deploy

- Hard refresh en el navegador (Ctrl+Shift+R o Cmd+Shift+R) para evitar caché.
- Abrir: https://smile-transformation-platform-dev.vercel.app/
- Deberías ver: barra verde "Free evaluation", hero con los 3 botones, "Why Medellín + Manizales", tarjetas con "Start with this package".

Resumen: **no están al aire con la misma versión que en local hasta que hagas commit + push de todos los cambios y Vercel vuelva a construir desde esa rama.**
