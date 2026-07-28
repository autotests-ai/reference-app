#!/usr/bin/env bash
# Tests (Selenide) unit + JaCoCo + SonarQube upload + quality gate poll.
# Soft-skip when SONAR_TOKEN unset or host unreachable.
# Env: SONAR_TOKEN, SONAR_HOST_URL (default https://sonar.qa.guru), SONAR_PROJECT_KEY
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/tests"

export SONAR_HOST_URL="${SONAR_HOST_URL:-https://sonar.qa.guru}"
export SONAR_PROJECT_KEY="${SONAR_PROJECT_KEY:-reference-app-tests}"
export SONAR_REQUIRED="${SONAR_REQUIRED:-true}"

echo "==> unit + jacoco (${SONAR_PROJECT_KEY})"
./gradlew testUnit jacocoTestUnitReport --no-daemon

if [[ -z "${SONAR_TOKEN:-}" ]]; then
  msg="SONAR_TOKEN unset — skip sonar upload"
  if [[ "$SONAR_REQUIRED" == "true" ]]; then
    echo "ERROR: $msg (SONAR_REQUIRED=true)" >&2
    exit 1
  fi
  echo "WARNING: $msg"
  exit 0
fi

if ! curl -sf --max-time 15 "${SONAR_HOST_URL%/}/api/system/status" >/dev/null; then
  msg="Sonar host unreachable: ${SONAR_HOST_URL}"
  if [[ "$SONAR_REQUIRED" == "true" ]]; then
    echo "ERROR: $msg" >&2
    exit 1
  fi
  echo "WARNING: $msg — skip upload"
  exit 0
fi

echo "==> sonar scan → ${SONAR_HOST_URL} (${SONAR_PROJECT_KEY})"
./gradlew sonar --no-daemon \
  -Dsonar.host.url="${SONAR_HOST_URL}" \
  -Dsonar.token="${SONAR_TOKEN}" \
  -Dsonar.projectKey="${SONAR_PROJECT_KEY}" \
  -Dsonar.projectName="${SONAR_PROJECT_KEY}"

echo "==> quality gate poll"
if command -v python >/dev/null 2>&1; then
  PY=python
elif command -v python3 >/dev/null 2>&1; then
  PY=python3
elif [[ -x /usr/bin/python3 ]]; then
  PY=/usr/bin/python3
else
  echo "WARNING: no python for gate poll — skip (SONAR_REQUIRED=${SONAR_REQUIRED})"
  echo "dashboard_url=${SONAR_HOST_URL%/}/dashboard?id=${SONAR_PROJECT_KEY}"
  if [[ "$SONAR_REQUIRED" == "true" ]]; then
    exit 1
  fi
  exit 0
fi
"$PY" <<'PY'
import json, os, sys, time, urllib.error, urllib.parse, urllib.request

base = os.environ.get("SONAR_HOST_URL", "https://sonar.qa.guru").rstrip("/")
key = os.environ.get("SONAR_PROJECT_KEY", "reference-app-tests")
token = os.environ.get("SONAR_TOKEN", "")
required = os.environ.get("SONAR_REQUIRED", "false") == "true"
timeout = int(os.environ.get("SONAR_GATE_TIMEOUT", "600"))
poll = int(os.environ.get("SONAR_GATE_POLL", "15"))
deadline = time.monotonic() + timeout
last = None
qs = urllib.parse.urlencode({"projectKey": key})
url = f"{base}/api/qualitygates/project_status?{qs}"
while time.monotonic() < deadline:
    req = urllib.request.Request(url)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        status = payload.get("projectStatus", {}).get("status", "UNKNOWN")
        last = status
        if status in ("OK", "PASSED", "FAILED", "ERROR"):
            break
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        last = f"ERROR:{exc}"
    time.sleep(poll)

dashboard = f"{base}/dashboard?id={urllib.parse.quote(key)}"
print(f"gate_status={last}")
print(f"dashboard_url={dashboard}")
if last in ("OK", "PASSED"):
    sys.exit(0)
if required:
    sys.exit(1)
print("WARNING: quality gate not PASSED — soft-fail (SONAR_REQUIRED=false)", file=sys.stderr)
sys.exit(0)
PY
