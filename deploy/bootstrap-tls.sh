#!/usr/bin/env bash
# One-time TLS + nginx bootstrap for reference-app.autotests.ai on prod host.
# Run on server as: sudo /tmp/sync-nginx.sh  (NOPASSWD path for selenoid user)
set -euo pipefail

DOMAIN="${DOMAIN:-reference-app.autotests.ai}"
SITE_NAME="${NGINX_SITE_NAME:-reference-app.autotests.ai}"
SITE_PATH="/etc/nginx/sites-available/${SITE_NAME}"
WEBROOT="/var/www/certbot"
BACKEND_PORT="${SERVER_PORT:-8083}"
TMP_HTTP="/tmp/nginx-${SITE_NAME}.http"
TMP_HTTPS="/tmp/nginx-${SITE_NAME}.https"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (sudo /tmp/sync-nginx.sh)" >&2
  exit 1
fi

mkdir -p "$WEBROOT"

cat >"$TMP_HTTP" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${WEBROOT};
    }

    location / {
        return 503 'reference-app: waiting for TLS bootstrap\n';
        add_header Content-Type text/plain;
    }
}
EOF

cp "$TMP_HTTP" "$SITE_PATH"
ln -sf "$SITE_PATH" "/etc/nginx/sites-enabled/${SITE_NAME}"
nginx -t
systemctl reload nginx
echo "OK: HTTP vhost for ACME (${SITE_NAME})"

if [[ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  certbot certonly \
    --webroot -w "$WEBROOT" \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --keep-until-expiring
  echo "OK: cert issued for ${DOMAIN}"
else
  echo "OK: cert already exists for ${DOMAIN}"
fi

cat >"$TMP_HTTPS" <<EOF
upstream reference_app_backend {
    server 127.0.0.1:${BACKEND_PORT};
    keepalive 8;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header X-Content-Type-Options nosniff always;

    access_log /var/log/nginx/${DOMAIN}.access.log;
    error_log  /var/log/nginx/${DOMAIN}.error.log;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_pass http://reference_app_backend;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${WEBROOT};
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

cp "$TMP_HTTPS" "$SITE_PATH"
nginx -t
systemctl reload nginx
echo "OK: HTTPS vhost reloaded (${SITE_NAME} → 127.0.0.1:${BACKEND_PORT})"
