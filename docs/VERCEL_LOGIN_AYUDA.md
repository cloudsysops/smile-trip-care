# Ayuda: no puedo hacer login en Vercel

Puede ser **una de dos cosas**. Sigue los pasos según tu caso.

---

## 1. No puedo entrar a la **cuenta de Vercel** (vercel.com)

Es decir: no logras abrir el dashboard en https://vercel.com (tu equipo, proyectos, deployments).

### Opciones para entrar

1. **Entrar con GitHub (recomendado)**  
   - Ve a https://vercel.com  
   - Clic en **Sign In** → **Continue with GitHub**  
   - Autoriza a Vercel si te lo pide  
   - Si ya vinculaste la cuenta antes, deberías entrar directo  

2. **Entrar con email**  
   - **Sign In** → escribe el **mismo email** con el que creaste la cuenta  
   - Si no recuerdas la contraseña: **Forgot password?** → revisa correo (y spam)  
   - Crea contraseña nueva y vuelve a intentar  

3. **Cuenta de equipo (Team)**  
   - Si el proyecto es de un **Team**, tienes que estar invitado a ese equipo  
   - Entra a vercel.com con **tu** cuenta → en el selector arriba (donde dice tu nombre o el equipo) elige el **Team** donde está el proyecto  
   - Si no ves el equipo: pide a quien lo administra que te invite (Settings → Members → Invite)  

4. **Problemas frecuentes**  
   - **“Invalid credentials”**: contraseña equivocada o cuenta con otro email → usa “Forgot password” con el email correcto  
   - **No me llega el email**: revisa spam; añade `vercel.com` a contactos; prueba otro proveedor (Gmail, etc.) si es posible  
   - **Cuenta con GitHub**: si creaste la cuenta con “Login with GitHub”, **debes** seguir entrando con GitHub, no solo con email  

### Si sigues sin poder entrar

- Soporte de Vercel: https://vercel.com/help  
- O desde el dashboard: **Help** (abajo a la izquierda) → **Contact Support**  

---

## 2. No puedo hacer login en **mi app** desplegada en Vercel

Es decir: la app en https://smile-transformation-platform-dev.vercel.app (o tu dominio) carga, pero en **/login** no logras iniciar sesión (error, no redirige, etc.).

### Comprobar variables de entorno (Supabase Auth)

La app usa **Supabase** para login. En Vercel tienen que estar configuradas:

1. Entra a https://vercel.com (con la cuenta que sí funcione; ver sección 1).  
2. Abre el **proyecto** (ej. `smile-transformation-platform-dev`).  
3. **Settings** → **Environment Variables**.  
4. Confirma que existan y estén para **Production** (y Preview si usas previews):

   - `NEXT_PUBLIC_SUPABASE_URL`  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`  

   Sin estas, el login en la app no puede conectar con Supabase.

5. Después de cambiar variables: **Redeploy** (Deployments → último deploy → ⋮ → Redeploy).

### Comportamiento esperado

- **/login**: formulario email + contraseña.  
- Al enviar: la app llama a Supabase; si es correcto, redirige a `/admin` o a la ruta en `?next=`.  
- Si ves “Invalid email or password”: las credenciales son incorrectas o el usuario no existe en Supabase (Auth → Users).

### Si el usuario es admin / coordinador / etc.

Esos usuarios se crean **en Supabase** (Dashboard → Authentication → Users) o por tu flujo interno. La app no tiene “registro público” para admin; el registro en **/signup** es para **pacientes**.  
Para probar login de admin: crea el usuario en Supabase y luego usa ese email y contraseña en **/login** de la app en Vercel.

---

## Resumen

| Problema | Dónde mirar |
|----------|-------------|
| No entro a **vercel.com** | Login con GitHub o email, “Forgot password”, equipo correcto, soporte Vercel |
| No entro en **/login** de mi app | Variables `NEXT_PUBLIC_SUPABASE_*` en Vercel, redeploy, usuario creado en Supabase |

Si me dices exactamente qué ves (pantalla de login de Vercel vs pantalla /login de tu app y el mensaje de error), puedo afinar los pasos.
