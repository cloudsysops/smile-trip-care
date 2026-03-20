#!/usr/bin/env bash
# Inicio de sprint: verificación, estado del repo, objetivo.
# Uso: desde smile-transformation-platform -> ./scripts/sprint-start.sh [nombre-rama-opcional]

set -e
cd "$(dirname "$0")/.."
PROJECT_DIR="$PWD"

echo "═══════════════════════════════════════════════════════════════"
echo "  SPRINT START — Nebula Smile"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Estado del repo
if git rev-parse --is-inside-work-tree &>/dev/null; then
  BRANCH=$(git branch --show-current)
  echo "  Rama actual: $BRANCH"
  if [ -n "$(git status --porcelain)" ]; then
    echo "  ⚠ Working tree con cambios sin commit (stash o commit antes de empezar)."
  else
    echo "  ✓ Working tree limpio"
  fi
  echo ""
fi

# 2. Verificación (lint + test + build)
echo "  Verificación (lint + test + build)..."
echo "───────────────────────────────────────────────────────────────"
if ./scripts/verify_all.sh; then
  echo "───────────────────────────────────────────────────────────────"
  echo "  ✓ Verify OK — listo para sprint"
else
  echo "───────────────────────────────────────────────────────────────"
  echo "  ❌ Verify falló. Corrige antes de iniciar el sprint."
  exit 1
fi
echo ""

# 3. Rama opcional
if [ -n "$1" ]; then
  if git rev-parse --is-inside-work-tree &>/dev/null && ! git show-ref --verify --quiet "refs/heads/$1"; then
    git checkout -b "$1"
    echo "  ✓ Rama creada: $1"
  fi
  echo ""
fi

# 4. Objetivo del sprint actual
echo "  Objetivo del sprint actual: Deploy & production verification"
echo "  • Vercel conectado, env configurados, deploy desde main"
echo "  • Stripe webhook en prod, test 200"
echo "  • Smoke: health, assessment → lead → depósito → webhook"
echo ""
echo "  Docs: docs/SPRINT.md | docs/DEPLOY_CHECKLIST.md"
echo "═══════════════════════════════════════════════════════════════"
echo ""
