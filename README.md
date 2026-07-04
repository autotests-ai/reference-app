# reference-app

Generic Spring Boot + static JS + Gradle test pyramid — reference stack for generators and onboarding.

GitHub: **[github.com/autotests-ai/reference-app](https://github.com/autotests-ai/reference-app)** · monorepo workspace: `projects/reference-home/`

| Path | Role |
|------|------|
| `backend/` | Spring Boot — `GET /api/health`, `GET /api/items`, static UI, Flyway + Postgres |
| `frontend/` | design-system symlinks (`scripts/wire-ui.sh`) |
| `tests/` | Browser + API tests (Selenide, Gradle); `@Tag smoke`, `api`, `component` |
| `app-static/` | App pages (index.html, app.js, app.css) — overlaid by sync |
| `scripts/` | `wire-ui.sh`, `sync-app-static.sh`, `gen-env-configs.py` |
| `docker-compose.yml` | `postgres` + `backend` on `:8080` |

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

# E2E smoke
cd tests && ./gradlew testE2e -Denv=reference_local_e2e -DallureReportMode=none
```

Regenerate `reference_local_*` env profiles: `python scripts/gen-env-configs.py`

## Env profiles

| Stand | Example | baseUrl |
|-------|---------|---------|
| `reference_local` | `reference_local_e2e` | `http://localhost:8080/` |
| `reference_local` | `reference_local_component` | `http://localhost:3000/` (design-system preview) |

## Component tests

Preview catalog on `:3000` (see `../dev/README.md`):

```bash
cd ../design-system-home/design-system/preview && python -m http.server 3000
cd ../../reference-app/tests && ./gradlew testComponent -DpyramidStand=reference_local
```

## Related

- Design system SSOT: `projects/design-system-home/design-system/`
- Product (do not copy branding): `projects/autotests-ai-home/autotests-ai-app/`
- Generator stack: `stacks/java-spring/`, `generators/matrix.yaml`
