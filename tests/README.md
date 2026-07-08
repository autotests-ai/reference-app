# reference-app — tests

Selenide + JUnit 5 + Allure. Full testing pyramid for generic reference stack.

## Prerequisites

- JDK 21
- Chrome (local)
- **App stack** — `docker compose up -d` (:8080) or `cd backend && ./gradlew bootRun`
- **Component** — design-system preview on :3000 (see `../../dev/README.md`)

## Quick start

```bash
# Terminal 1 — design-system preview (component layer)
cd projects/design-system-home/design-system/preview && python -m http.server 3000

# Terminal 2 — app stack
./scripts/sync-app-static.sh
docker compose up -d --build

cd tests
./gradlew testComponent -DpyramidStand=reference_local -DallureReportMode=none
./gradlew testE2e -Denv=reference_local_e2e -DallureReportMode=none
./gradlew testApi -DpyramidStand=reference_local -DallureReportMode=none
./gradlew testIntegration -DpyramidStand=reference_local -DallureReportMode=none
```

## Pyramid (reference_local stand)

| Layer | Classes | Gradle task |
|-------|---------|-------------|
| unit (backend) | `ItemServiceTest`, `AuthServiceTest`, `JwtServiceTest` | `cd backend && ./gradlew test` |
| unit (tests) | `helpers/*Test`, `config/*Test` | `testUnit` |
| integration | `LoginFormTests`, `LoginEmbedTests` | `testIntegration` |
| component | `LangToggleTests`, `PrimitiveSizeTests`, `PlaqueFieldSegTests` | `testComponent` |
| api | `ReferenceApiTests`, `AuthApiTests` | `testApi` |
| e2e smoke | `HomeTests`, `LoginTests`, `RegisterTests`, `LogoutTests` | `testE2e` |
| e2e visual | `LoginBaselineTests`, `WelcomePanelBaselineTests`, `HomeLayoutBaselineTests`, `PlaqueFieldGridMixedBaselineTests` | `testVisual` |
| manual | `@Manual` methods in `LoginTests` | `testManual` |

Contract: `stacks/_contract/openapi.yaml`, `stacks/_contract/flows/login.md`.

```bash
cd backend && ./gradlew test

cd tests
./gradlew testUnit -DpyramidStand=reference_local -DallureReportMode=none
./gradlew testComponent -DpyramidStand=reference_local -DallureReportMode=none
./gradlew testIntegration -DpyramidStand=reference_local -DallureReportMode=none
./gradlew testApi -DpyramidStand=reference_local -DallureReportMode=none
./gradlew testE2e -Denv=reference_local_e2e -DallureReportMode=none
./gradlew testVisual -Denv=reference_local_visual -DallureReportMode=none
./gradlew testManual -DpyramidStand=reference_local -DallureReportMode=none
```

Visual baselines: commit PNG under `src/test/resources/screenshots/{login,welcome-panel,home-layout,plaque-field-grid-mixed}/` or refresh locally:

```bash
./gradlew testVisual -Denv=reference_local_visual -DupdateBaselines=true -DallureReportMode=none
```

Env profiles: `python ../scripts/gen-env-configs.py`
