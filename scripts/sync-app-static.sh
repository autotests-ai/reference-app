#!/usr/bin/env bash
# Wire design-system into frontend/, then materialize css/js/templates into backend static.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MONOREPO_ROOT="$(cd "$ROOT/../../.." && pwd)"
while [[ "$MONOREPO_ROOT" != "/" && ! -f "$MONOREPO_ROOT/generators/matrix.yaml" ]]; do
  MONOREPO_ROOT="$(dirname "$MONOREPO_ROOT")"
done
export MONOREPO_ROOT UI="${UI:-design-system-embed}" SCREENS="${SCREENS:-}"

"$ROOT/scripts/wire-ui.sh"

STATIC="$ROOT/backend/src/main/resources/static"
mkdir -p "$STATIC"

for d in css js templates; do
  rsync -a "$ROOT/frontend/$d/" "$STATIC/$d/"
done

for f in allure-shell.css allure-shell.js; do
  if [[ -f "$ROOT/frontend/$f" ]]; then
    cp -a "$ROOT/frontend/$f" "$STATIC/"
  fi
done

# App-specific pages (index.html, app.js, app.css) — not from design-system
rsync -a "$ROOT/app-static/" "$STATIC/"

echo "sync-app-static: frontend + app-static → backend/src/main/resources/static/"
