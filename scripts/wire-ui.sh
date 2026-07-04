#!/usr/bin/env bash
# Wire design-system primitives and optional contract screens into a rendered project.
# Called by render.sh; also copied to stacks/<stack>/scripts/wire-ui.sh on derive.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MONOREPO_ROOT="${MONOREPO_ROOT:?MONOREPO_ROOT required}"
UI="${UI:-design-system-embed}"
SCREENS="${SCREENS:-}"
MANIFEST="${MANIFEST:-$MONOREPO_ROOT/stacks/_contract/ui.manifest.yaml}"

FRONTEND="$PROJECT_ROOT/frontend"
DS="$MONOREPO_ROOT/projects/design-system-home/design-system"

mkdir -p "$FRONTEND"

if [[ "$UI" == "design-system-embed" ]]; then
  for f in allure-shell.css allure-shell.js; do
    if [[ -f "$DS/$f" ]]; then
      cp -a "$DS/$f" "$FRONTEND/"
    fi
  done
  for d in css js templates; do
    rel="$(python -c "import os; print(os.path.relpath('$DS/$d', '$FRONTEND'))")"
    ln -sfn "$rel" "$FRONTEND/$d"
  done
  echo "wire-ui: design-system → frontend/ (embed)"
elif [[ "$UI" == "plain" ]]; then
  echo "wire-ui: plain (skip design-system embed)"
else
  echo "STOP: unknown UI mode: $UI (expected design-system-embed or plain)" >&2
  exit 1
fi

if [[ -n "$SCREENS" ]]; then
  if [[ ! -f "$MANIFEST" ]]; then
    echo "STOP: ui manifest missing at $MANIFEST" >&2
    exit 1
  fi
  python - "$MANIFEST" "$MONOREPO_ROOT" "$PROJECT_ROOT" "$SCREENS" <<'PY'
import os
import shutil
import sys

import yaml

manifest_path, monorepo, project, screens_csv = sys.argv[1:5]
screens = [s.strip() for s in screens_csv.split(",") if s.strip()]
data = yaml.safe_load(open(manifest_path))
catalog = data.get("screens", {})

for sid in screens:
    if sid not in catalog:
        raise SystemExit(f"STOP: unknown screen {sid!r} — see stacks/_contract/ui.manifest.yaml")
    entry = catalog[sid]
    src = os.path.join(monorepo, entry["canon"])
    dest = os.path.join(project, entry["dest"])
    if not os.path.isfile(src):
        raise SystemExit(f"STOP: canon screen missing: {src}")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy2(src, dest)
    print(f"wire-ui: screen {sid} → {entry['dest']}")
PY
fi
