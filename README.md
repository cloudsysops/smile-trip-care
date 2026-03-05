# Smile Transformation Platform

Plataforma web para coordinación y hospitalidad de experiencias (USA LLC). Los servicios médicos son facturados por clínicas en Colombia. Stack: **Next.js 16** (App Router), **TypeScript**, **Supabase** (Auth, Postgres, Storage), **Stripe**, **Vercel**.

## Arrancar en local

```bash
npm install
cp .env.example .env.local   # rellenar Supabase (y Stripe cuando aplique)
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run smoke:assets` | Validación básica de assets (admin) |

## Variables de entorno

- `.env.example` y `.env.local.example` listan las variables necesarias.
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Stripe (cuando se use): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, etc.

## Documentación

- [Estado de módulos](STATUS.md)
- [Modelo de datos (MVP)](docs/DATA_MODEL.md)
- [Pasos de prueba](docs/TEST_STEPS.md)
- **[Usar Cursor desde el móvil (GitHub + Cursor Mobile)](docs/CURSOR_MOBILE.md)**
- **[Conectar GitHub con Vercel y desplegar](docs/VERCEL_DEPLOY.md)**

## Usar con Cursor (desktop o móvil)

- Reglas del proyecto para la IA: `.cursor/rules.md`.
- Para **abrir este proyecto en Cursor Mobile** (iPhone/Android) o en **Cursor Agents** (web): sigue la guía [docs/CURSOR_MOBILE.md](docs/CURSOR_MOBILE.md) (crear repo en GitHub, conectar remoto, push, abrir desde la app o la web).

## Deploy

Compatible con Vercel. Configurar env en el dashboard y desplegar desde la rama `main`.
