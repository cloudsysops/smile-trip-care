#!/usr/bin/env bash
# Cierre de sprint: verificación final, checklist PR y deploy.
# Uso: desde smile-transformation-platform -> ./scripts/sprint-end.sh

set -e
cd "$(dirname "$0")/.."
PROJECT_DIR="$PWD"

echo "═══════════════════════════════════════════════════════════════"
echo "  SPRINT END — Nebula Smile"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Verificación final
echo "  Verificación final (lint + test + build)..."
echo "───────────────────────────────────────────────────────────────"
if ./scripts/verify_all.sh; then
  echo "───────────────────────────────────────────────────────────────"
  echo "  ✓ Verify OK — listo para merge/PR"
else
  echo "───────────────────────────────────────────────────────────────"
  echo "  ❌ Verify falló. No cerrar sprint hasta que pase."
  exit 1
fi
echo ""

# 2. Estado repo
if git rev-parse --is-inside-work-tree &>/dev/null; then
  BRANCH=$(git branch --show-current)
  echo "  Rama actual: $BRANCH"
  if [ -n "$(git status --porcelain)" ]; then
    echo "  ⚠ Hay cambios sin commit"
  fi
  echo ""
fi

# 3. Checklist cierre
echo "  Checklist cierre de sprint:"
echo "  [ ] PR creado (rama → main) y revisado"
echo "  [ ] CI en verde (GitHub Actions)"
echo "  [ ] Merge a main"
echo "  [ ] Deploy en Vercel (automático si está conectado)"
echo "  [ ] Smoke en prod: /api/health, assessment, webhook Stripe"
echo "  [ ] STATUS.md y docs/SPRINT.md actualizados"
echo ""
echo "  Deploy: docs/DEPLOY_CHECKLIST.md | docs/PRODUCCIÓN_CHECKLIST.md"
echo "═══════════════════════════════════════════════════════════════"
echo ""
