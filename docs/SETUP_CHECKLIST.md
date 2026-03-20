# Checklist de configuración

Última ejecución automática: 2026-03-08.

## Hecho en esta sesión

| Paso | Estado | Nota |
|------|--------|------|
| `npm install` | OK | Dependencias al día, 0 vulnerabilidades |
| `npm run db:migrate` | OK | Migraciones aplicadas (Supabase project linked) |
| Seed marketplace | Pendiente | Requiere `DATABASE_URL` en `.env.local` (ver abajo) |
| `npm run lint` | OK | ESLint sin errores |
| `npm run test` | OK | 28 tests pasando |
| `npm run build` | OK | Build de producción correcto |
| App respondiendo | OK | `GET /api/health` → 200 |

## Pendiente (cuando vuelvas)

### 1. Ejecutar el seed del marketplace (opcional)

Si quieres datos de ejemplo (Clínica San Martín, specialists, experiences, packages):

**Opción A — Desde tu máquina (recomendado)**  
Asegúrate de tener en `.env.local` la variable **`DATABASE_URL`** con la URI de Postgres de Supabase (Settings → Database → Connection string → URI). Luego:

```bash
./scripts/run_seed_marketplace.sh
```

**Opción B — Desde Supabase**  
Supabase Dashboard → SQL Editor → pegar y ejecutar el contenido de `scripts/seed_marketplace_foundation.sql`.

### 2. Probar la app en local

Si no está ya en marcha:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). La API de health está en [http://localhost:3000/api/health](http://localhost:3000/api/health).

---

Variables de entorno: ver [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md) (SUPABASE_URL vs DATABASE_URL, Stripe, etc.).
