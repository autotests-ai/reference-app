# reference-app

Generic Spring Boot + static JS + Gradle test pyramid — reference stack for generators and onboarding.

GitHub: **[github.com/autotests-ai/reference-app](https://github.com/autotests-ai/reference-app)** · monorepo workspace: `projects/reference-home/`

| Path | Role |
|------|------|
| `backend/` | Spring Boot — `GET /api/health`, `GET /api/items`, JWT auth API, static UI, Flyway + Postgres |
| `frontend/` | design-system symlinks (`scripts/wire-ui.sh`) |
| `tests/` | Browser + API tests (Selenide, Gradle); `@Tag smoke`, `api`, `component` |
| `app-static/` | App pages (index, login, register) — overlaid by sync |
| `preview/` | Component catalog snapshot (`components.html`) for `testComponent` |
| `scripts/` | `wire-ui.sh`, `sync-app-static.sh`, `sync-component-preview.sh`, `gen-env-configs.py` |
| `deploy/` | nginx vhost, server deploy, smoke |
| `.github/workflows/deploy.yml` | Autodeploy to production on push `main` |
| `docker-compose.yml` | `postgres` + `backend` on `:8080` (local) / `:8083` (prod) |

## Auth

| Page | URL |
|------|-----|
| Home | `/` |
| Login | `/login` |
| Register | `/register` |

| API | Method |
|-----|--------|
| `/api/auth/register` | POST — create account, returns JWT |
| `/api/auth/login` | POST — returns JWT (`authToken` in localStorage) |
| `/api/auth/logout` | POST |
| `/api/auth/me` | GET — Bearer profile |

Seed user: `user1` / `password1` (created on startup if missing).

Contract: `stacks/_contract/openapi.yaml`, `flows/login.md`.

## Quick start

```bash
# Materialize design-system into backend static
./scripts/sync-app-static.sh

# PostgreSQL + backend
docker compose up -d --build

# Unit (backend)
cd backend && ./gradlew test

# API
cd tests && ./gradlew testApi -DpyramidStand=reference_local

# E2E smoke (login + home)
cd tests && ./gradlew testE2e -Denv=reference_local_e2e -DallureReportMode=none
```

Regenerate `reference_local_*` env profiles: `python scripts/gen-env-configs.py`

## Env profiles

| Stand | Example | baseUrl |
|-------|---------|---------|
| `reference_local` | `reference_local_e2e` | `http://localhost:8080/` |
| `reference_local` | `reference_local_component` | `http://localhost:3000/` (design-system preview) |
| `reference_prod` | `reference_prod_e2e` | `https://reference-app.autotests.ai/` + remote Selenoid cloud |

## Component tests

Committed snapshot in `preview/` (regenerate after design-system changes):

```bash
./scripts/sync-component-preview.sh
cd preview && python -m http.server 3000
cd ../tests && ./gradlew testComponent -DpyramidStand=reference_local -DallureReportMode=none
```

Monorepo dev may also use `projects/design-system-home/design-system/preview/` on `:3000` — see `../dev/README.md`.

## Deploy

**Production:** https://reference-app.autotests.ai

**Server (136.243.89.21 — selenoid user):**

```bash
export SERVER_PORT=8083
bash deploy/server-deploy.sh
```

Or manual bootstrap:

```bash
mkdir -p ~/reference-app
git clone https://github.com/autotests-ai/reference-app.git ~/reference-app
cd ~/reference-app
export SERVER_PORT=8083
docker compose up -d --build
bash deploy/smoke-remote.sh https://reference-app.autotests.ai
sudo NGINX_CONF_SRC=./deploy/nginx/reference-app.autotests.ai.conf \
  NGINX_SITE_NAME=reference-app.autotests.ai \
  bash deploy/nginx/sync-nginx.sh
```

**Autodeploy (GitHub Actions → production):** push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

| Name | Kind | Value |
|------|------|-------|
| `DEPLOY_SSH_KEY` | secret | deploy SSH private key (shared with autotests.ai) |
| `DEPLOY_HOST` | variable (optional) | `136.243.89.21` |
| `DEPLOY_USER` | variable (optional) | `selenoid` |

**Allure TestOps:** отдельный проект [5274](https://allure.autotests.cloud/project/5274) (не шарить с другими consumers).

| Name | Kind | Value |
|------|------|-------|
| `ALLURE_PROJECT_ID` | variable | `5274` |
| `ALLURE_ENDPOINT` | variable | `https://allure.autotests.cloud` |
| `ALLURE_TOKEN` | secret | TestOps upload token (см. ethalon CI: allurectl opt-in по `ALLURE_PROJECT_ID`) |

**DNS:** `reference-app.autotests.ai` → `136.243.89.21` (A record).

**TLS:** one-time bootstrap on prod host (NOPASSWD `sudo /tmp/sync-nginx.sh` for `selenoid`):

```bash
scp deploy/bootstrap-tls.sh selenoid-prod:/tmp/sync-nginx.sh
ssh selenoid-prod 'sudo /tmp/sync-nginx.sh'
```

Or after DNS propagates: `sudo certbot certonly --webroot -w /var/www/certbot -d reference-app.autotests.ai`

**Ports on prod host:** backend `8083` (Selenoid UI `:8080`, autotests.ai `:8081`, Jenkins `:8082`).

Nginx: `deploy/nginx/reference-app.autotests.ai.conf`

## Related

- Design system SSOT: `projects/design-system-home/design-system/`
- Product (do not copy branding): `projects/autotests-ai-home/autotests-ai-app/`
- Generator stack: `stacks/java-spring/`, `generators/matrix.yaml`
