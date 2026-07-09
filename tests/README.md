# reference-app — tests

Selenide + JUnit 5 + Allure. Full testing pyramid for generic reference stack.

## Naming

| Kind | ID | Meaning |
|------|-----|---------|
| **Stand** | `reference_ci` | docker compose on `localhost` + headless Chrome on runner (CI or laptop) |
| **Stand** | `reference_prod` | `https://reference-app.autotests.ai/` + Selenoid remote |
| **Env profile** | `{stand}_{layer}` | e.g. `reference_ci_e2e`, `reference_prod_api` |
| **CI job** | `ci-pyramid` | full pyramid on `reference_ci` (push/PR or `workflow_dispatch` → `ci_pyramid`) |
| **CI job** | `prod-pyramid` | post-deploy smoke on `reference_prod` (or manual `prod_*` slices) |

## Prerequisites

- JDK 21
- Chrome (local)
- **App stack** — `docker compose up -d` (:8080) or `cd backend && ./gradlew bootRun`
- **Component** — `preview/` on :3000 (`python -m http.server 3000` from `preview/`)

## CI

| Workflow | Trigger | Slices |
|----------|---------|--------|
| `reference_pyramid.yml` | push/PR `main` | `ci-pyramid`: unit → api → integration → e2e → component → visual |
| `reference_pyramid.yml` | after `Deploy production` | `prod-pyramid`: `testApi` + `testE2e` (Selenoid) |
| `reference_pyramid.yml` | workflow_dispatch | `ci_pyramid` \| `prod_api` \| `prod_e2e` \| `prod_visual` |
| `reference_visual_baselines.yml` | workflow_dispatch | refresh Linux PNG baselines |

## Quick start

```bash
# Terminal 1 — design-system preview (component layer)
cd projects/design-system-home/design-system/preview && python -m http.server 3000

# Terminal 2 — app stack
./scripts/sync-app-static.sh
docker compose up -d --build

cd tests
./gradlew testComponent -DpyramidStand=reference_ci -DallureReportMode=none
./gradlew testE2e -Denv=reference_ci_e2e -DallureReportMode=none
./gradlew testApi -DpyramidStand=reference_ci -DallureReportMode=none
./gradlew testIntegration -DpyramidStand=reference_ci -DallureReportMode=none
```

## Pyramid (`reference_ci` stand)

| Layer | Classes | Gradle task |
|-------|---------|-------------|
| unit (backend) | `ItemServiceTest`, `AuthServiceTest`, `JwtServiceTest` | `cd backend && ./gradlew test` |
| unit (tests) | `helpers/*Test`, `config/*Test` | `testUnit` |
| integration | `LoginFormTests`, `LoginEmbedTests` | `testIntegration` |
| component | `LangToggleTests`, `PrimitiveSizeTests`, `PlaqueFieldSegTests`, … | `testComponent` |
| api | `ReferenceApiTests`, `AuthApiTests` | `testApi` |
| e2e smoke | `HomeTests`, `LoginTests`, `RegisterTests`, `LogoutTests` | `testE2e` |
| e2e visual | `LoginBaselineTests`, `WelcomePanelBaselineTests`, `HomeLayoutBaselineTests`, `PlaqueFieldGridMixedBaselineTests` | `testVisual` |
| manual | exploratory stubs (none in `LoginTests`; use `testManual` slice when added) | `testManual` |

Contract: `stacks/_contract/openapi.yaml`, `stacks/_contract/flows/login.md`.

```bash
cd backend && ./gradlew test

cd tests
./gradlew testUnit -DpyramidStand=reference_ci -DallureReportMode=none
./gradlew testComponent -DpyramidStand=reference_ci -DallureReportMode=none
./gradlew testIntegration -DpyramidStand=reference_ci -DallureReportMode=none
./gradlew testApi -DpyramidStand=reference_ci -DallureReportMode=none
./gradlew testE2e -Denv=reference_ci_e2e -DallureReportMode=none
./gradlew testVisual -Denv=reference_ci_visual -DallureReportMode=none
./gradlew testManual -DpyramidStand=reference_ci -DallureReportMode=none
```

Visual baselines: commit PNG under `src/test/resources/screenshots/{login,welcome-panel,home-layout,plaque-field-grid-mixed}/`.

**CI SSOT:** Linux headless Chrome 148 (`reference_visual_baselines.yml` workflow_dispatch). macOS local may differ — refresh with `-DupdateBaselines=true` or accept CI as source of truth.

```bash
./gradlew testVisual -Denv=reference_ci_visual -DupdateBaselines=true -DallureReportMode=none
```

Env profiles: `python ../scripts/gen-env-configs.py`
