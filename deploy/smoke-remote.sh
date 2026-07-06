#!/usr/bin/env bash
# Post-deploy smoke for reference-app.autotests.ai (strict TLS — no curl -k).
set -euo pipefail

BASE_URL="${1:-https://reference-app.autotests.ai}"
BASE_URL="${BASE_URL%/}"

echo "=== TLS + GET ${BASE_URL}/ ==="
code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/")"
echo "HTTP ${code}"
[[ "$code" == "200" ]] || { echo "FAIL: expected 200" >&2; exit 1; }

echo "=== GET ${BASE_URL}/api/health ==="
body="$(curl -fsSL "${BASE_URL}/api/health")"
echo "$body" | grep -q '"status":"ok"' || { echo "FAIL: missing ok status" >&2; exit 1; }
echo "$body" | grep -q 'reference-app' || { echo "FAIL: missing reference-app service" >&2; exit 1; }

echo "Smoke OK: ${BASE_URL}"
