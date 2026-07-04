#!/usr/bin/env bash
# Open allure-dashboard live preview and run mock index simulator.
# Usage: run-live-dashboard-preview.sh [--poll MS] [--interval MS] [--steps N] [--slow]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"
INDEX_OUTPUT="$REPO_ROOT/tests-java/build/analytics-index.json"
POLL_MS=300
INTERVAL_MS=""
STEPS=8

while [[ $# -gt 0 ]]; do
  case "$1" in
    --poll)
      POLL_MS="${2:-300}"
      shift 2
      ;;
    --interval)
      INTERVAL_MS="${2:-300}"
      shift 2
      ;;
    --steps)
      STEPS="${2:-8}"
      shift 2
      ;;
    --fast)
      POLL_MS=200
      shift
      ;;
    --slow)
      POLL_MS=3000
      shift
      ;;
    -h | --help)
      echo "Usage: run-live-dashboard-preview.sh [--poll MS] [--interval MS] [--steps N] [--fast|--slow]"
      echo "  --poll     preview polling + generator tick (default 300ms, range 100–5000)"
      echo "  --interval generator only; defaults to --poll"
      echo "  --fast     alias for --poll 200"
      echo "  --slow     alias for --poll 3000"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

INTERVAL_MS="${INTERVAL_MS:-$POLL_MS}"
DASHBOARD_URL="http://localhost:3000/allure-dashboard.html?live=1&poll=${POLL_MS}"
WARMUP_SEC=2
if [[ "$POLL_MS" -le 500 ]]; then
  WARMUP_SEC=1
fi

if ! lsof -ti :3000 >/dev/null 2>&1; then
  echo "run-live-dashboard-preview: starting http.server :3000 in frontend/ (persistent)"
  (cd "$FRONTEND_DIR" && python -m http.server 3000) &
  sleep 0.4
else
  echo "run-live-dashboard-preview: http.server :3000 already running"
fi

ln -sfn ../tests-java/build/analytics-index.json "$FRONTEND_DIR/analytics-index.json"

if command -v open >/dev/null 2>&1; then
  open "$DASHBOARD_URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$DASHBOARD_URL"
else
  echo "run-live-dashboard-preview: open $DASHBOARD_URL manually"
fi

echo "run-live-dashboard-preview: waiting ${WARMUP_SEC}s for browser (poll=${POLL_MS}ms)…"
sleep "$WARMUP_SEC"

echo "run-live-dashboard-preview: simulator → $INDEX_OUTPUT (${STEPS} steps, ${INTERVAL_MS}ms)"
node "$SCRIPT_DIR/simulate-live-analytics-index.mjs" \
  --output "$INDEX_OUTPUT" \
  --steps "$STEPS" \
  --interval "$INTERVAL_MS" \
  --poll "$POLL_MS"

echo "run-live-dashboard-preview: done — $DASHBOARD_URL"
