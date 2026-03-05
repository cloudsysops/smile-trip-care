# Usar Cursor desde el móvil con este proyecto

Guía para tener el repo en GitHub y abrirlo en **Cursor Mobile** (iOS/Android) o en **Cursor Agents** (web/PWA) para trabajar desde el teléfono o tablet.

---

## 1. Crear el repositorio en GitHub

1. Entra en [github.com/new](https://github.com/new).
2. **Repository name:** `smile-transformation-platform` (o el que prefieras).
3. **Visibility:** Private o Public.
4. No inicialices con README, .gitignore ni license (ya existen en el proyecto).
5. Clic en **Create repository**.

---

## 2. Conectar este proyecto con GitHub (solo una vez)

En la terminal (en tu Mac o en Cursor Desktop), desde la raíz del proyecto:

```bash
cd /ruta/a/smile-transformation-platform

# Añadir el remoto (sustituye TU_USUARIO por tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/smile-transformation-platform.git

# Subir la rama main
git push -u origin main
```

Si GitHub te pide autenticación, usa **Personal Access Token** (Settings → Developer settings → Personal access tokens) con al menos el scope `repo`.

---

## 3. Abrir el proyecto en Cursor Mobile

### Opción A: Cursor Mobile (app iOS/Android)

1. Instala **Cursor Mobile** desde App Store (iOS) o Google Play (Android).
2. Inicia sesión con la misma cuenta de Cursor que en desktop.
3. En la app: **Projects** → **Connect repository** (o **Add project**).
4. Elige **GitHub** y autoriza si es la primera vez.
5. Busca y selecciona el repo. **Nombre exacto:** `smile-transformation-platform-` (con **guion al final**). Está en la organización **cloudsysops**.
6. El proyecto se clonará y podrás abrirlo para editar, usar el chat con la IA y el terminal en la nube.

**Si no ves el repo** → ve a [Soluciones si no aparece el repo](#soluciones-si-no-aparece-el-repo).

### Opción B: Cursor Agents (navegador / PWA)

1. Entra en [cursor.com/agents](https://cursor.com/agents).
2. Inicia sesión con tu cuenta Cursor.
3. Conecta GitHub si aún no lo has hecho.
4. Crea o abre un agente y asocia el repo `smile-transformation-platform` para que trabaje sobre ese código (ideal para tareas en segundo plano desde el móvil).

---

## 3.1 Soluciones si no aparece el repo

El repo está en **GitHub** como `cloudsysops/smile-transformation-platform-` (organización **cloudsysops**, nombre con guion al final). Si no lo ves en Cursor Mobile:

### A) Dar acceso a la organización

Cursor Mobile solo puede listar repos a los que tiene permiso. Si el repo está en la **org cloudsysops**:

1. En **GitHub** (navegador): **Settings** (tu cuenta) → **Applications** → **Authorized OAuth Apps**.
2. Busca **Cursor** (o la app que use Cursor Mobile) y clic en **Configure**.
3. En **Organization access**, asegúrate de que **cloudsysops** esté en **Grant** (no en "Request" ni "No access"). Si dice "Request", acepta la solicitud desde la org: GitHub → cloudsysops → **Settings** → **Third-party access** y autoriza Cursor.

O desde la org: **cloudsysops** → **Settings** → **Third-party access** → que Cursor tenga acceso.

### B) Refrescar la lista

En Cursor Mobile, en la pantalla de **Projects** o **Connect repository**:
- Arrastra hacia abajo para **actualizar** la lista de repos (pull to refresh).
- O cierra sesión de GitHub en la app y vuelve a **Connect repository** → **GitHub** para que vuelva a cargar los repos.

### C) Abrir por URL (si sigue sin salir)

Si tienes opción **Clone from URL** o **Add by URL**:
- Pega: `https://github.com/cloudsysops/smile-transformation-platform-.git`  
Así abres el repo aunque no aparezca en la lista.

### D) Comprobar el nombre

Busca exactamente: **smile-transformation-platform-** (con el guion **al final**). No solo "smile-transformation-platform".

---

## 4. Variables de entorno (opcional en móvil)

Para **solo leer código, hacer commits y usar la IA** no necesitas env en el móvil.

Si en Cursor Mobile usas **entornos en la nube** y quieres ejecutar la app:

- Copia `.env.example` a `.env.local` en el proyecto.
- Rellena en tu entorno cloud (o en Cursor) las variables que necesites (Supabase, Stripe, etc.), tal como en [README](../README.md#variables-de-entorno).

---

## 5. Flujo recomendado desde el móvil

| Acción              | Dónde hacerla                          |
|---------------------|----------------------------------------|
| Revisar código      | Cursor Mobile → abrir archivos         |
| Preguntar a la IA   | Cursor Mobile → Chat                   |
| Pequeños edits      | Cursor Mobile → editor                 |
| Commits / push      | Cursor Mobile → Git (stage, commit, push) |
| Build / tests pesados | Cursor Desktop o CI (GitHub Actions) |

---

## 6. Repo listo para Cursor

En este proyecto ya tienes:

- **README.md** — descripción del proyecto y cómo ejecutarlo.
- **.cursor/rules.md** — reglas para la IA (válidas también en Cursor Mobile).
- **.github/** — template de PR y workflows de CI (lint/build).

Así, al abrir el repo en Cursor (desktop o mobile), la IA tendrá contexto del stack (Next.js, Supabase, Stripe) y de las convenciones del código.

---

## Resumen rápido

1. Crear repo en GitHub (vacío).
2. `git remote add origin https://github.com/TU_USUARIO/smile-transformation-platform.git` y `git push -u origin main`.
3. En el móvil: Cursor Mobile → Connect repository → GitHub → elegir `smile-transformation-platform`.

Si algo falla (permisos, token, 404), revisa que el repo exista, que el remote sea correcto y que tu token tenga permisos `repo`.
