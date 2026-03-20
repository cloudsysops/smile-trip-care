# Checklist: salir a producción para vender

Usar cuando la app esté lista para clientes reales y pagos en vivo.

---

## Infra y deploy

- [ ] **Vercel** – Proyecto conectado a GitHub; Production = rama `main`.
- [ ] **Variables de entorno (Production)** en Vercel: Supabase prod, Stripe **live**, OpenAI si aplica.
- [ ] **Dominio** – Dominio custom en Vercel (ej. `app.smiletrip.com`) y SSL activo.

## Base de datos (Supabase prod)

- [ ] Proyecto Supabase de **producción** creado.
- [ ] Migraciones aplicadas en orden: `0001_init.sql` → `0002_*` → `0003_*` → `0004_*`.
- [ ] Seed de paquetes si aplica: `scripts/seed_packages.sql`.
- [ ] Al menos un usuario **admin**: en Auth crear usuario y en `profiles` poner `role = 'admin'`.

## Pagos (Stripe live)

- [ ] Cuenta Stripe en modo **Live** (no Test).
- [ ] En Vercel (Production): `STRIPE_SECRET_KEY` (live), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (live).
- [ ] Webhook en Stripe Dashboard: URL `https://tu-dominio.com/api/stripe/webhook`, eventos necesarios (ej. `checkout.session.completed`).
- [ ] En Vercel: `STRIPE_WEBHOOK_SECRET` = signing secret del webhook **live**.

## Comportamiento y pruebas

- [ ] Login admin en la URL de producción.
- [ ] Landing y assessment en prod; envío de lead correcto.
- [ ] Flujo de depósito: Checkout Stripe → pago con tarjeta real o de prueba live → webhook recibe evento y actualiza lead (ej. `deposit_paid`).
- [ ] Health: `GET https://tu-dominio.com/api/health` y `/api/health/ready` → 200 OK.

## Legal y negocio (recomendado)

- [ ] Aviso de privacidad / términos si aplica.
- [ ] Emails/notificaciones que envía la app (Stripe, Supabase Auth) con remitente y contenido correctos.

---

Cuando todo esté marcado: **listos para vender** en producción.

Detalle de entornos (DEV local con Docker, QA, Prod): [DEV_QA_PROD.md](./DEV_QA_PROD.md).
