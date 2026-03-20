# Vercel no muestra la versión nueva (producción = local)

## Qué está pasando

En el **único deploy** (smile-transformation-platform-dev.vercel.app) se ve la versión antigua (ej. "Get started", "Start your journey"). En **local** tienes la versión nueva ("Start Free Evaluation", "View Packages", "Why Medellín + Manizales"). El código ya está en `main` y se hizo un commit vacío para forzar redeploy.

## Pasos en Vercel (hazlos en este orden)

### 1. Rama de producción

1. Entra en [vercel.com](https://vercel.com) → tu proyecto (nombre que termina en **-dev**; es el único).
2. **Settings** → **Git**.
3. Revisa **Production Branch**. Debe ser **`main`**.
4. Si pone otra rama (p. ej. `master`, `production-hardening`), cámbiala a **main** y guarda. Eso hará que el próximo deploy de producción use `main`.

### 2. Último deploy

1. Pestaña **Deployments**.
2. El primer deploy de la lista debería ser reciente (commit "chore: trigger Vercel redeploy from main" o "chore: align repo with local...").
3. Si el **último deploy está en rojo (Failed)**:
   - Entra en ese deploy y mira **Build Logs**.
   - Corrige el error (dependencias, env, etc.) y haz **Redeploy** desde el menú (⋯) del deploy, o push de nuevo a `main`.
4. Si el último deploy está **en verde** pero la web sigue mostrando lo antiguo:
   - Comprueba que el dominio **Production** (no Preview) apunte a ese deploy. Arriba suele decir "Production" o el dominio.
   - Prueba en **incógnito** o **hard refresh** (Cmd+Shift+R / Ctrl+Shift+R) para evitar caché del navegador.

### 3. Redeploy manual (si hace falta)

1. **Deployments** → clic en el deploy más reciente que esté en verde.
2. Menú (⋯) → **Redeploy**.
3. Marca **Use existing Build Cache** solo si antes el build ya pasó con el mismo código; si no, desmárcala para forzar build limpio.

### 4. Comprobar que ya es la versión nueva

Abre en incógnito:

- https://smile-transformation-platform-dev.vercel.app/

Deberías ver en el hero algo como **"Start Free Evaluation"** y **"View Packages"**, y más abajo la sección **"Why Medellín + Manizales"**. Si sigues viendo "Get started" y "Start your journey", la producción sigue sirviendo un deploy antiguo (revisa de nuevo la rama y qué deploy está asignado a Production).

---

**Resumen:** La causa más común es que **Production Branch** en Vercel no sea `main`, o que el último deploy haya fallado y Production siga apuntando a un deploy viejo. Ajusta la rama a `main`, espera al nuevo build o haz Redeploy, y verifica en incógnito.
