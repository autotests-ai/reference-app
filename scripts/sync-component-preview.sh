#!/usr/bin/env bash
# Materialize minimal design-system preview for component tests (components.html + CSS/JS closure).
# SSOT: monorepo projects/design-system-home/design-system/
# Target: reference-app/preview/ (committed snapshot for standalone CI).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MONOREPO_ROOT="$(cd "$ROOT/../../.." && pwd)"
while [[ "$MONOREPO_ROOT" != "/" && ! -f "$MONOREPO_ROOT/generators/matrix.yaml" ]]; do
  MONOREPO_ROOT="$(dirname "$MONOREPO_ROOT")"
done

DS="$MONOREPO_ROOT/projects/design-system-home/design-system"
SRC_PREVIEW="$DS/preview/components.html"
DEST="$ROOT/preview"

if [[ ! -f "$SRC_PREVIEW" ]]; then
  echo "STOP: design-system preview missing at $SRC_PREVIEW" >&2
  echo "Set MONOREPO_ROOT or run from projects/reference-home/reference-app inside zero-design-system." >&2
  exit 1
fi

python - "$DS" "$SRC_PREVIEW" "$DEST" <<'PY'
import re
import shutil
import sys
from pathlib import Path

ds_root = Path(sys.argv[1])
src_html = Path(sys.argv[2])
dest = Path(sys.argv[3])

css_dir = dest / "css"
js_dir = dest / "js"
css_dir.mkdir(parents=True, exist_ok=True)
js_dir.mkdir(parents=True, exist_ok=True)

html = src_html.read_text(encoding="utf-8")
html = html.replace('href="../css/', 'href="css/')
html = html.replace('src="../js/', 'src="js/')
(dest / "components.html").write_text(html, encoding="utf-8")

link_css = re.findall(r'<link[^>]+href="css/([^"]+)"', html)
script_js = re.findall(r'<script[^>]+src="js/([^"]+)"', html)

css_todo = [css_dir / name for name in link_css]
css_done: set[Path] = set()

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


for name in link_css:
    copy_css(name)

js_todo = list(script_js)
js_done: set[str] = set()


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


for name in script_js:
    copy_js(name)

print(f"sync-component-preview: {dest}/")
print(f"  components.html")
print(f"  css/ ({len(css_done)} files)")
print(f"  js/ ({len(js_done)} files)")
PY
