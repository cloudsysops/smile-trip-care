#!/usr/bin/env bash
set -e
export NEXT_BUILD_WORKERS=1
echo "=== Lint ==="
npm run lint
echo "=== Test ==="
npm run test
echo "=== Build ==="
rm -rf .next/lock
npm run build
echo "=== Verify complete ==="
