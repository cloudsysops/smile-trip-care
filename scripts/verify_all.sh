#!/usr/bin/env bash
set -e
echo "=== Lint ==="
npm run lint
echo "=== Build ==="
npm run build
echo "=== Verify complete ==="
