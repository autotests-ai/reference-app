#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/selenoid/reference-app}"
REPO_URL="${REPO_URL:-https://github.com/autotests-ai/reference-app.git}"
export SERVER_PORT="${SERVER_PORT:-8083}"

if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo mkdir -p "$APP_DIR"
  sudo chown "$(whoami):$(whoami)" "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch --all
git reset --hard origin/main

docker compose build backend
docker compose up -d --remove-orphans

for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${SERVER_PORT}/api/health" | grep -q '"status":"ok"'; then
    break
  fi
  sleep 2
done
curl -fsS "http://127.0.0.1:${SERVER_PORT}/api/health" | grep -q '"status":"ok"'

bash deploy/smoke-remote.sh https://reference-app.autotests.ai

if [[ -f deploy/nginx/reference-app.autotests.ai.conf ]]; then
  sudo NGINX_CONF_SRC=./deploy/nginx/reference-app.autotests.ai.conf \
    NGINX_SITE_NAME=reference-app.autotests.ai \
    bash deploy/nginx/sync-nginx.sh
fi

echo "Deploy OK: https://reference-app.autotests.ai"
