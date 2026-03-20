#!/usr/bin/env bash
# Quita un usuario de los miembros de un proyecto Vercel (y opcionalmente del equipo).
# Uso:
#   ./scripts/remove_vercel_collaborator.sh cboteros-sf
#   ./scripts/remove_vercel_collaborator.sh cboteros-sf <vercel-project-slug>
# Requisito: variable de entorno VERCEL_TOKEN con un token de cuenta/team admin.
# Crear token: https://vercel.com/account/tokens

set -e
USER_TO_REMOVE="${1:?Usage: $0 <vercel-username> [project-name]}"
# Default matches current Vercel project slug; pass explicit name when renamed.
PROJECT_NAME="${2:-smile-transformation-platform-dev}"

if [ -z "$VERCEL_TOKEN" ]; then
  echo "ERROR: Necesitas definir VERCEL_TOKEN (token con permisos de admin del equipo)."
  echo "Crear token: https://vercel.com/account/tokens"
  echo "Ejemplo: export VERCEL_TOKEN=xxx && $0 $*"
  exit 1
fi

API="https://api.vercel.com"
echo "Listando miembros del proyecto: $PROJECT_NAME"
echo ""

# Listar miembros del proyecto (si usas equipo, añade ?teamId=... o ?slug=...)
RESP=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "$API/v1/projects/$PROJECT_NAME/members?limit=100")
echo "$RESP" | jq -r '.members[]? | "\(.username) (uid: \(.uid))"' 2>/dev/null || echo "$RESP"

# Buscar uid de cboteros-sf
UID=$(echo "$RESP" | jq -r --arg u "$USER_TO_REMOVE" '.members[]? | select(.username == $u) | .uid' 2>/dev/null)
if [ -z "$UID" ] || [ "$UID" = "null" ]; then
  echo ""
  echo "No se encontró a '$USER_TO_REMOVE' en este proyecto. Nada que quitar."
  exit 0
fi

echo ""
echo "Quitando a $USER_TO_REMOVE (uid: $UID) del proyecto $PROJECT_NAME..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  "$API/v1/projects/$PROJECT_NAME/members/$UID")
if [ "$HTTP" = "200" ]; then
  echo "Listo: $USER_TO_REMOVE eliminado del proyecto."
else
  echo "Error: la API devolvió HTTP $HTTP. ¿Tienes permisos de admin?"
  exit 1
fi
