# reference-app

Generic Spring Boot + static JS + Gradle test pyramid — reference stack for generators and onboarding.

GitHub: **[github.com/autotests-ai/reference-app](https://github.com/autotests-ai/reference-app)** · monorepo workspace: `projects/reference-home/`

[![Reference App](https://autotests-ai.github.io/reference-app/readme/badge.svg)](https://autotests-ai.github.io/reference-app/reports/latest/dashboard/)

[![Reference App stats](https://autotests-ai.github.io/reference-app/readme/stats.svg)](https://autotests-ai.github.io/reference-app/reports/latest/dashboard/)

[![Reference App metrics](https://autotests-ai.github.io/reference-app/readme/metrics-panel.svg)](https://autotests-ai.github.io/reference-app/reports/latest/dashboard/)

## Automated Tests Dashboard

Live SVG metrics + Allure 3 dashboard (pyramid tile **testingPyramid**), updated after each prod pyramid run on `main`:

<a href="https://autotests-ai.github.io/reference-app/reports/latest/dashboard/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://autotests-ai.github.io/reference-app/readme/dashboard-preview-dark.png">
    <img
      src="https://autotests-ai.github.io/reference-app/readme/dashboard-preview.png"
      alt="Allure 3 dashboard — pyramid, status dynamics, success distribution"
      width="800"
    />
  </picture>
</a>

Dashboard PNG updates after each prod pyramid run on `main` (Playwright screenshot of Allure 3 dashboard).

| Link | Description |
|------|-------------|
| [Dashboard](https://autotests-ai.github.io/reference-app/reports/latest/dashboard/) | Full pyramid — unit → api → integration → e2e → component → visual |
| [Awesome](https://autotests-ai.github.io/reference-app/reports/latest/awesome/) | Drill-down by layer / epic |
| [TestOps project](https://allure.qa.guru/project/5274) | Cloud launches |
| [CI workflow](https://github.com/autotests-ai/reference-app/actions/workflows/reference_github-pyramid.yml) | `ci-pyramid` (PR) + `prod-pyramid` (post-deploy) |
| [Jenkins](https://jenkins.qa.guru/job/reference-app-tests/) | Prod pyramid on `java-jdk21` agents — Allure 3 + TestOps + Jira REF |

Production app: [reference-app.autotests.ai](https://reference-app.autotests.ai)

| Path | Role |
|------|------|
| `backend/` | Spring Boot — `GET /api/health`, `GET /api/items`, JWT auth API, static UI, Flyway + Postgres |
| `frontend/` | design-system embed symlinks (`scripts/wire-ui.sh`) |
| `frontend-react/` | React SPA (Vite + React Router + `@zero-design-system/react`); builds `index.html` + `assets/` into `backend/.../static` |
| `tests/` | Browser + API tests (Selenide, Gradle); `@Tag smoke`, `api`, `component` |
| `tests-js/` | Playwright UI smoke (RealWorld-style App facade); Jenkins `reference-app-tests-freestyle-js-playwright` |
| `tests-python/` | Selenium UI smoke (Java-style page objects + pytest); Jenkins `reference-app-tests-freestyle-python-selenium` |
| `app-static/` | App CSS + auxiliary JS overlaid by sync (SPA pages `/`, `/login`, `/register` come from `frontend-react`) |
| `preview/` | Component catalog snapshot (`components.html`) for `testComponent` |
| `scripts/` | `wire-ui.sh`, `sync-app-static.sh`, `sync-component-preview.sh`, `gen-env-configs.py` |
| `deploy/` | nginx vhost, server deploy, smoke |
| `.github/workflows/deploy.yml` | Autodeploy to production on push `main` |
| `.github/workflows/reference_github-build-backend.yml` | Backend bootJar + Docker image (artifact; optional registry push) |
| `.github/workflows/reference_github-pyramid.yml` | CI orchestrator: `ci-pyramid` (PR/push) + `prod-pyramid` (post-deploy) |
| `Jenkinsfile` | Jenkins job `reference-app-tests` on [jenkins.qa.guru](https://jenkins.qa.guru/job/reference-app-tests/) (Allure 3 plugin + TestOps 5274 + Jira/Confluence REF) |
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

Contract: `stacks/_contract/openapi.yaml`, `stacks/_contract/flows/login.md`.

## Frontend (React SPA)

`frontend-react/` is a Vite + React Router single-page app (routes `/`, `/login`, `/register`) built on the `@zero-design-system/react` library (aliased to the monorepo `packages/react-ui/src`). It replaces the former static multipage `app.js` / `auth.js` / `*.html`.

- The canonical design-system header stays SSOT: `index.html` sets `window.headerConfig` and loads `/js/header.js` (design-system embed) at runtime — the SPA does not reimplement the header.
- All `data-testid` attributes and the exact validation / welcome / health strings are preserved for the Selenide suite in `tests/`.
- `vite build` emits `index.html` + `assets/index.{js,css}` into `backend/src/main/resources/static` (`emptyOutDir: false` — the design-system embed and `preview/` catalog are left untouched). `PageController` forwards `/login` and `/register` to `index.html` for client-side routing.

```bash
cd frontend-react
npm ci
npm run dev        # local dev server
npm run build      # -> backend/src/main/resources/static (index.html + assets/)
npm run typecheck  # tsc --noEmit
npm test           # Vitest + React Testing Library
```

`scripts/sync-app-static.sh` runs the SPA build as its final step, after the design-system CSS/JS/templates are materialized.

## Quick start

```bash
# Materialize design-system into backend static (also builds the React SPA)
./scripts/sync-app-static.sh

# PostgreSQL + backend
docker compose up -d --build

# Unit (backend) + JaCoCo HTML report (100% line coverage gate)
cd backend && ./gradlew test jacocoTestCoverageVerification
# open build/reports/jacoco/test/html/index.html

# Pyramid unit (config + helpers) — 100% line gate on unit slice
cd tests && ./gradlew testUnit jacocoTestUnitCoverageVerification -DpyramidStand=reference_ci

# API
cd tests && ./gradlew testApi -DpyramidStand=reference_ci

# E2E smoke (login + home)
cd tests && ./gradlew testE2e -Denv=reference_ci_e2e -DallureReportMode=none
```

Regenerate `reference_ci_*` env profiles: `python scripts/gen-env-configs.py`

## Env profiles

| Stand | Example | baseUrl |
|-------|---------|---------|
| `reference_ci` | `reference_ci_e2e` | `http://localhost:8080/` |
| `reference_ci` | `reference_ci_component` | `http://localhost:3000/` (design-system preview) |
| `reference_prod` | `reference_prod_e2e` | `https://reference-app.autotests.ai/` + remote Selenoid cloud |

## Component tests

Committed snapshot in `preview/` (regenerate after design-system changes):

```bash
./scripts/sync-component-preview.sh
cd preview && python -m http.server 3000
cd ../tests && ./gradlew testComponent -DpyramidStand=reference_ci -DallureReportMode=none
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

**Autodeploy (GitHub Actions → production):** push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), then post-deploy [`.github/workflows/reference_github-pyramid.yml`](.github/workflows/reference_github-pyramid.yml) (`prod-pyramid`: api + e2e on Selenoid).

**CI pyramid (PR / push):** [`.github/workflows/reference_github-pyramid.yml`](.github/workflows/reference_github-pyramid.yml) job `ci-pyramid` — full stack on docker compose + headless Chrome (no Selenoid).

**Manual slices:** `workflow_dispatch` → `reference-app Tests` → `ci_pyramid` | `prod_api` | `prod_e2e` | `prod_visual`.

**Visual baselines (Linux SSOT):** [`.github/workflows/reference_visual_baselines.yml`](.github/workflows/reference_visual_baselines.yml).

| Name | Kind | Value |
|------|------|-------|
| `DEPLOY_SSH_KEY` | secret | deploy SSH private key (shared with autotests.ai) |
| `DEPLOY_HOST` | variable (optional) | `136.243.89.21` |
| `DEPLOY_USER` | variable (optional) | `selenoid` |

**Allure TestOps:** отдельный проект [5274](https://allure.qa.guru/project/5274) (не шарить с другими consumers).

| Name | Kind | Value |
|------|------|-------|
| `ALLURE_PROJECT_ID` | variable | `5274` |
| `ALLURE_ENDPOINT` | variable | `https://allure.qa.guru` |
| `ALLURE_TOKEN` | secret | TestOps upload token (см. ethalon CI: allurectl opt-in по `ALLURE_PROJECT_ID`) |

**DNS:** `reference-app.autotests.ai` → `136.243.89.21` (A record).

**TLS:** one-time bootstrap on prod host (NOPASSWD `sudo /tmp/sync-nginx.sh` for `selenoid`):

```bash
scp deploy/bootstrap-tls.sh selenoid-prod:/tmp/sync-nginx.sh
ssh selenoid-prod 'sudo /tmp/sync-nginx.sh'
```

Or after DNS propagates: `sudo certbot certonly --webroot -w /var/www/certbot -d reference-app.autotests.ai`

**Ports on prod host:** backend `8083` (Selenoid UI `:8080`, autotests.ai `:8081`, Jenkins `:8082`).

**Optional CI registry push** (`reference_github-build-backend.yml`): `vars.DOCKER_IMAGE` + `secrets.DOCKER_REGISTRY_TOKEN` (skipped on PR).

Nginx: `deploy/nginx/reference-app.autotests.ai.conf`

## Related

- Design system SSOT: `projects/design-system-home/design-system/`
- Product (do not copy branding): `projects/autotests-ai-home/autotests-ai-app/`
- Generator stack: `stacks/java-spring/`, `generators/matrix.yaml`
