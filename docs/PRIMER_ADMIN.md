# Cómo crear el primer usuario admin

Nebula Smile usa **Supabase Auth** para autenticación. Las rutas de administración comprueban que el usuario tenga `profiles.role = 'admin'`. Las tablas relevantes son:

- **auth.users** — usuarios de Supabase Auth
- **public.profiles** — perfil extendido (`id` referencia `auth.users`, `role` es texto: `'user'` o `'admin'`)

Sin asignar el rol `admin` en `profiles`, aunque puedas acceder a `/admin/login`, las APIs de admin devolverán **403 Forbidden**.

---

## Pasos

### 1. Crear el usuario en Supabase Auth

Elige una de estas opciones:

- **Opción A — Dashboard de Supabase**  
  En el proyecto: **Authentication → Users → Add user**. Crea el usuario con email y contraseña (o el método que uses).

- **Opción B — Signup en la app**  
  Si tienes registro público, regístrate con el email que quieras usar como admin. El usuario quedará en `auth.users` y normalmente se creará una fila en `public.profiles` con `role = 'user'`.

### 2. Obtener el UUID del usuario

En **Supabase Dashboard**:

- **Authentication → Users** → localiza el usuario y copia su **User UID** (UUID).

### 3. Asignar rol admin en la base de datos

En **Supabase Dashboard → SQL Editor**, ejecuta:

**Si el perfil ya existe** (por ejemplo, creado por un trigger al registrarse):

```sql
update public.profiles
set role = 'admin'
where id = '<user-uuid>';
```

Sustituye `<user-uuid>` por el UID del usuario (ej: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

**Si el perfil no existe** (usuario creado solo desde el Dashboard sin trigger):

```sql
insert into public.profiles (id, role)
values ('<user-uuid>', 'admin')
on conflict (id) do update set role = 'admin';
```

### 4. Comprobar

- Cierra sesión en la app si estabas logueado.
- Entra en `/admin/login` e inicia sesión con ese usuario.
- Las rutas y APIs de admin deberían responder correctamente; si el rol no está en `profiles`, seguirás recibiendo 403.

---

## Nota de seguridad

No uses la **service role key** ni lógica de servicio privilegiado en el cliente (navegador o app pública). La asignación de `role = 'admin'` debe hacerse solo desde el **Dashboard de Supabase** (SQL o políticas que solo ejecutes tú como administrador del proyecto), nunca expuesta en el frontend.
