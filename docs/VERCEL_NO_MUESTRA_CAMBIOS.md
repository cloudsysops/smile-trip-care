# Vercel no muestra los cambios recientes

Si ya hiciste **merge a `main`** (p. ej. los PRs de branding, patient journey, landing) pero en la URL de Vercel sigues viendo la versión antigua, revisa lo siguiente.

## 1. Vercel no se configura en GitHub

**Vercel se configura en el dashboard de Vercel**, no en GitHub. La conexión es:

- En **Vercel** → Add New → Project → **Import** el repo de GitHub (ej. `cloudsysops/smile-transformation-platform-`).
- Una vez conectado, cada **push a la rama de producción** dispara un deploy automático.

No hay nada que “activar” en GitHub para que Vercel despliegue; todo es en [vercel.com](https://vercel.com).

---

## 2. Checklist: por qué no ves los cambios

### A. Rama de producción en Vercel

1. Entra en [vercel.com](https://vercel.com) → tu equipo → **proyecto** (nombre que suele terminar en `-dev`).
2. **Settings** → **Git**.
3. Mira **Production Branch**. Debe ser **`main`**.
4. Si pone otra rama (`master`, `production-hardening`, etc.), cámbiala a **`main`** y guarda.  
   Así los próximos pushes a `main` desplegarán a producción.

### B. ¿El último deploy terminó bien?

1. Pestaña **Deployments**.
2. El deploy más reciente (arriba) debería ser de hoy o del último merge a `main`.
3. Si está **en rojo (Failed)**:
   - Entra al deploy → **Build Logs** y corrige el error (env, dependencias, etc.).
   - Luego: menú (⋯) del deploy → **Redeploy** (o haz un nuevo push a `main`).
4. Si está **en verde** pero la web sigue antigua:
   - Comprueba que el **dominio de Production** (ej. `smile-transformation-platform-dev.vercel.app`) esté asignado a ese deploy.
   - Prueba en **ventana de incógnito** o **hard refresh** (Cmd+Shift+R / Ctrl+Shift+R) por si es caché del navegador.

### C. ¿El repo conectado es el correcto?

1. **Settings** → **Git**.
2. Verifica que el **Repository** sea el correcto (ej. `cloudsysops/smile-transformation-platform-`).
3. Si conectaste otro repo o un fork, Vercel despliega ese código, no el de tu `main` actual.

### D. Forzar un redeploy

1. **Deployments** → el deploy más reciente que esté en verde.
2. Menú (⋯) → **Redeploy**.
3. Si el código es el mismo que ya construyó bien, puedes marcar **Use existing Build Cache**. Si cambiaste algo y quieres build limpio, desmárcala.

---

## 3. Cómo se dispara un deploy

| Acción | Qué pasa |
|--------|----------|
| Push a `main` | Vercel hace **deploy automático** a producción (si el proyecto está conectado a ese repo y Production Branch = `main`). |
| Push a otra rama (ej. `feat/xyz`) | Vercel suele crear un **Preview** con su propia URL; no cambia la producción. |
| Solo merge en GitHub sin push | No aplica: el merge ya hace push a `main`, y ese push es el que dispara el deploy. |

No hace falta configurar nada en GitHub (webhooks, Actions para deploy, etc.) para que Vercel construya: con **conectar el repo una vez en Vercel** basta.

---

## 4. Comprobar que ya está la versión nueva

Abre en **incógnito**:

**https://smile-transformation-platform-dev.vercel.app/**

Deberías ver, por ejemplo:

- Hero: **"Transform Your Smile in Colombia and Save Up to 70%"** y **"Start My Free Smile Assessment"**.
- Sección **How it works** (3 pasos).
- **Verified Clinics** (Instituto Inmedent, Clínica San Martín).
- **Before/After** y testimonials.

Si sigues viendo textos viejos (“Get started”, “Start your journey”, etc.), entonces producción sigue sirviendo un deploy antiguo: revisa de nuevo **Production Branch = main**, que el último deploy esté en verde y que el dominio Production apunte a ese deploy.

---

## 5. Resumen

| Problema | Dónde revisar |
|----------|----------------|
| Los cambios están en `main` pero Vercel no los muestra | Vercel → Settings → Git → **Production Branch = main**; Deployments → último deploy en verde y asignado a Production. |
| Build falla | Deployments → deploy fallido → Build Logs. Corregir env o código y volver a desplegar. |
| No hay deploys al hacer push | Ver que el repo correcto esté conectado en Vercel (Settings → Git). |
| Creer que “falta algo en GitHub” | No: la integración es “repo conectado en Vercel”. No hay paso extra en GitHub para que Vercel despliegue. |

**Última revisión:** 2026-03 — un solo proyecto Vercel, URL `-dev`, producción desde `main`.
