# Definition of Ready (DoR)

Una tarea está **Ready** cuando puede implementarse sin bloquearse por falta de contexto.

## Problema claro
- El objetivo del cambio está definido (qué se quiere lograr y por qué).

## Criterios de aceptación
- Existe al menos una forma clara de verificar que funciona (qué debe ver el usuario o qué debe pasar en el sistema).

## Impacto técnico
- Se entiende qué partes del sistema pueden verse afectadas (rutas, componentes, APIs, DB, pagos, AI, etc.).

## Reutilización revisada
Antes de implementar se revisó:

- `docs/` (buscando specs previas o decisiones).
- Código existente (componentes, helpers, APIs).
- Componentes reutilizables o patrones ya implementados.

Solo se diseña algo nuevo si no hay equivalente reutilizable razonable.

## Riesgos conocidos
- Dependencias externas identificadas (Stripe, Supabase, OpenAI, cron, etc.).
- Cambios en DB o API considerados y, si aplica, con migración/contrato pensados.

