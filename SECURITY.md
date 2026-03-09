# Política de seguridad — MedVoyage Smile

## Reportar vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, **no** abras un issue público.

- **Email:** [indicar email de contacto de seguridad, ej. security@tudominio.com]
- **Alternativa:** Mensaje privado al mantenedor del repositorio o a la organización.

Incluye, si puedes:

- Descripción del problema y pasos para reproducir.
- Impacto estimado (ej. exposición de datos, elevación de privilegios).
- Sugerencia de mitigación si la tienes.

Comprometemos respuesta en un plazo razonable (objetivo: 72 h para primer contacto).

## Buenas prácticas en el repo

- No subir secretos, API keys ni credenciales. Usar variables de entorno (Vercel, Supabase, `.env.local` no commiteado).
- Dependencias: revisar alertas de Dependabot y actualizar con prontitud.
- Acceso: solo personas autorizadas con acceso de escritura; revisión por PR antes de merge a `main`.
- Despliegue: rama `main` protegida; secrets solo en GitHub / Vercel, nunca en código.

## Alcance

Esta política aplica al código y a la configuración de este repositorio y a los despliegues oficiales (p. ej. Vercel) vinculados a él.
