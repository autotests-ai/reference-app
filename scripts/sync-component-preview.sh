#!/usr/bin/env bash
# Materialize design-system preview pages for component tests (HTML + CSS/JS closure).
# SSOT: monorepo projects/design-system-home/design-system/
# Target: reference-app/preview/ (committed snapshot for standalone CI).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MONOREPO_ROOT="$(cd "$ROOT/../../.." && pwd)"
while [[ "$MONOREPO_ROOT" != "/" && ! -f "$MONOREPO_ROOT/generators/matrix.yaml" ]]; do
  MONOREPO_ROOT="$(dirname "$MONOREPO_ROOT")"
done

DS="$MONOREPO_ROOT/projects/design-system-home/design-system"
DEST="$ROOT/preview"

PREVIEW_PAGES=(
  components.html
  configurator-option-presets.html
  code-style-explorer.html
)

for page in "${PREVIEW_PAGES[@]}"; do
  if [[ ! -f "$DS/preview/$page" ]]; then
    echo "STOP: design-system preview missing at $DS/preview/$page" >&2
    exit 1
  fi
done

python - "$DS" "$DEST" "${PREVIEW_PAGES[@]}" <<'PY'
import re
import shutil
import sys
from pathlib import Path

ds_root = Path(sys.argv[1])
dest = Path(sys.argv[2])
pages = sys.argv[3:]

css_dir = dest / "css"
js_dir = dest / "js"
css_dir.mkdir(parents=True, exist_ok=True)
js_dir.mkdir(parents=True, exist_ok=True)

css_done: set[Path] = set()
js_done: set[str] = set()
import_pattern = re.compile(r'@import\s+url\("([^"]+)"\);')


def resolve_css_import(base_file: Path, href: str) -> Path:
    target = (base_file.parent / href).resolve()
    try:
        target.relative_to(css_dir.resolve())
    except ValueError as exc:
        raise SystemExit(f"STOP: css import escapes preview/css: {href} in {base_file}") from exc
    return target


def copy_css(file_rel: str) -> None:
    target = css_dir / file_rel
    if target in css_done:
        return
    source = ds_root / "css" / file_rel
    if not source.is_file():
        raise SystemExit(f"STOP: missing css source {source}")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    css_done.add(target)
    text = target.read_text(encoding="utf-8")
    for href in import_pattern.findall(text):
        imported = resolve_css_import(target, href)
        copy_css(imported.relative_to(css_dir).as_posix())


def copy_js(file_rel: str) -> None:
    if file_rel in js_done:
        return
    source = ds_root / "js" / file_rel
    if not source.is_file():
        raise SystemExit(f"STOP: missing js source {source}")
    target = js_dir / file_rel
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    js_done.add(file_rel)
    text = source.read_text(encoding="utf-8")
    for match in re.findall(r"""from ['"]\./([^'"]+)['"]""", text):
        copy_js(match)


materialized: list[str] = []
for page in pages:
    src_html = ds_root / "preview" / page
    html = src_html.read_text(encoding="utf-8")
    html = html.replace('href="../css/', 'href="css/')
    html = html.replace('src="../js/', 'src="js/')
    (dest / page).write_text(html, encoding="utf-8")
    materialized.append(page)

    for name in re.findall(r'<link[^>]+href="css/([^"]+)"', html):
        copy_css(name)
    for name in re.findall(r'<script[^>]+src="js/([^"]+)"', html):
        copy_js(name)

print(f"sync-component-preview: {dest}/")
for page in materialized:
    print(f"  {page}")
print(f"  css/ ({len(css_done)} files)")
print(f"  js/ ({len(js_done)} files)")
PY
