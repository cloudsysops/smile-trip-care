#!/usr/bin/env bash
# Quita un usuario como colaborador de TODOS los repos de la org cloudsysops.
# Uso: ./scripts/remove_collaborator_github.sh cboteros-sf
# Requisito: gh (GitHub CLI) instalado y autenticado como admin de la org.

set -e
USER_TO_REMOVE="${1:?Usage: $0 <github-username>}"
ORG="cloudsysops"

echo "Buscando repos donde '$USER_TO_REMOVE' es colaborador en org $ORG..."
echo ""

REMOVED=0
CHECKED=0

for repo in $(gh repo list "$ORG" --limit 500 --json name -q '.[].name'); do
  full_repo="$ORG/$repo"
  CHECKED=$((CHECKED + 1))
  if gh api "repos/$full_repo/collaborators/$USER_TO_REMOVE" --silent 2>/dev/null; then
    echo "Removing $USER_TO_REMOVE from $full_repo"
    gh api -X DELETE "repos/$full_repo/collaborators/$USER_TO_REMOVE" && REMOVED=$((REMOVED + 1)) || true
  fi
done

echo ""
echo "Repos revisados: $CHECKED"
echo "Repos donde se quitó a $USER_TO_REMOVE: $REMOVED"
echo "Listo."
