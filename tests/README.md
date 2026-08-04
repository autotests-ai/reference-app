# reference-app — tests

Selenide + JUnit 5 + Allure. Full testing pyramid for generic reference stack.

**Matrix id (qa-guru-refs shape):** `java/gradle-junit5-selenide` — short path `tests/` is the SSOT alias.

Sibling stacks (same prod target; language-first layout):

| Path | Matrix id | Stack |
|------|-----------|--------|
| [`../java/gradle-junit5-selenium/`](../java/gradle-junit5-selenium/) | `java/gradle-junit5-selenium` | Java · Selenium 4 · JUnit 5 (smoke) |
| [`../tests-python/`](../tests-python/) | ≈ `python/pip-pytest-selenium` | Python · Selenium |
| [`../tests-js/`](../tests-js/) | ≈ `javascript/playwright` | Playwright |

Canon stays this directory — siblings do not replace the pyramid.

## Pyramid layers (this repo)

| Layer | Where | Notes |
|-------|--------|--------|
| unit | `../backend/src/test`, `testUnit` helpers | required |
| frontend_rtl | [`../frontend-react/`](../frontend-react/) | Vitest + RTL — **not** this Gradle module |
| api | `tests/api`, `testApi` | Rest Assured; OpenAPI SSOT in `stacks/_contract/` |
| integration | `tests/integration`, `testIntegration` | SPA mount (header, login form) |
| e2e / visual | `testE2e` / `testVisual` | Selenide |
| contracts | OpenAPI + `openapi-diff` | Pact = planned (see `generators/matrix-capabilities.yaml`) |

DS catalog Selenide checks live in `design-system-home` — not duplicated here.

## Naming

| Kind | ID | Meaning |
|------|-----|---------|
| **Stand** | `reference_ci` | docker compose on `localhost` + headless Chrome on runner (CI or laptop) |
| **Stand** | `reference_prod` | `https://reference-app.autotests.ai/` + Selenoid remote |
| **Env profile** | `{stand}_{layer}` | e.g. `reference_ci_e2e`, `reference_prod_api` |
| **CI job** | `ci-pyramid` | full pyramid on `reference_ci` (push/PR or `workflow_dispatch` → `ci_pyramid`) |
| **CI job** | `prod-pyramid` | post-deploy smoke on `reference_prod` (or manual `prod_*` profiles) |

## Remote e2e (canon)

Selenide `WebDriver` — **thread-local**. Каждый e2e-тест открывает/закрывает браузер (`closeBrowserAfterEach=true`); JUnit parallel безопасен.

| Слой | Правило |
|------|---------|
| `junit-platform.properties` | `parallel.enabled=true`, `fixed.parallelism=1` |
| `*_e2e` | `closeBrowserAfterEach=true` (`gen-env-configs.py`) |
| `prod-pyramid` / Jenkins freestyle | наследует SSOT (без `-D…parallel.enabled=false`) |

Локальная отладка с reuse browser / другим parallelism — rule `e2e-debug-run` (`-D` override), не менять SSOT properties.

## Prerequisites

- JDK 21
- Chrome (local)
- **App stack** — `docker compose up -d` (:8820) or `cd backend && ./gradlew bootRun`

## CI

| Workflow | Trigger | Slices |
|----------|---------|--------|
| `reference_github-pyramid.yml` | push/PR `main` | `ci-pyramid`: unit → api → integration → e2e → visual |
| `reference_github-pyramid.yml` | after `Deploy production` | `prod-pyramid`: `testApi` + `testE2e` (Selenoid, parallel=1) |
| `reference_github-pyramid.yml` | workflow_dispatch | `ci_pyramid` \| `prod_api` \| `prod_e2e` \| `prod_visual` |
| `reference_visual_baselines.yml` | workflow_dispatch | refresh Linux PNG baselines |

## Quick start

```bash
# App stack
./scripts/sync-app-static.sh
docker compose up -d --build

cd tests
./gradlew testIntegration -Denv=reference_ci -DallureReportMode=none
./gradlew testE2e -Denv=reference_ci_e2e -DallureReportMode=none
./gradlew testApi -Denv=reference_ci -DallureReportMode=none
```

## Pyramid (`reference_ci` stand)

| Layer | Classes | Gradle task |
|-------|---------|-------------|
| unit (backend) | `ItemServiceTest`, `AuthServiceTest`, `JwtServiceTest`, `ApiControllerTest`, `AuthControllerTest`, `JwtAuthFilterTest`, `PageControllerTest`, `ItemEntityTest`, `UserEntityTest`, `UserSeederTest` | `cd backend && ./gradlew test` |
| unit (tests) | `helpers/*Test`, `config/*Test` | `testUnit` |
| integration | `LoginFormTests`, `LoginEmbedTests` | `testIntegration` |
| api | `ReferenceApiTests`, `AuthApiTests` | `testApi` |
| e2e smoke | `HomeTests`, `LoginTests`, `RegisterTests`, `LogoutTests` | `testE2e` |
| e2e visual | `LoginBaselineTests`, `WelcomePanelBaselineTests`, `HomeLayoutBaselineTests` | `testVisual` |
| manual | exploratory stubs (none in `LoginTests`; use `testManual` profile when added) | `testManual` |

Contract: `stacks/_contract/openapi.yaml`, `stacks/_contract/flows/login.md`.

```bash
cd backend && ./gradlew test

cd tests
./gradlew testUnit -Denv=reference_ci -DallureReportMode=none
./gradlew testIntegration -Denv=reference_ci -DallureReportMode=none
./gradlew testApi -Denv=reference_ci -DallureReportMode=none
./gradlew testE2e -Denv=reference_ci_e2e -DallureReportMode=none
./gradlew testVisual -Denv=reference_ci_visual -DallureReportMode=none
./gradlew testManual -Denv=reference_ci -DallureReportMode=none
```

Visual baselines: commit PNG under `src/test/resources/screenshots/{login,welcome-panel,home-layout}/`.

**CI SSOT:** Linux headless Chrome 148 (`reference_visual_baselines.yml` workflow_dispatch). macOS local may differ — refresh with `-DupdateBaselines=true` or accept CI as source of truth.

```bash
./gradlew testVisual -Denv=reference_ci_visual -DupdateBaselines=true -DallureReportMode=none
```

Env profiles: `python ../scripts/gen-env-configs.py`
