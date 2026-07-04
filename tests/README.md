# reference-app — tests

Selenide + JUnit 5 + Allure. Browser/API pyramid for generic reference stack.

## Prerequisites

- JDK 21
- Chrome (local)
- **App stack** — `docker compose up -d` (:8080) or `cd backend && ./gradlew bootRun`
- **Component** — design-system preview on :3000 (see `../../dev/README.md`)

## Quick start

```bash
./scripts/sync-app-static.sh
docker compose up -d --build

cd tests
./gradlew testE2e -Denv=reference_local_e2e -DallureReportMode=none
./gradlew testApi -DpyramidStand=reference_local -DallureReportMode=none
./gradlew testComponent -DpyramidStand=reference_local -DallureReportMode=none
```

## Pyramid (reference_local stand)

| Layer | Tests | Tags |
|-------|-------|------|
| unit | `helpers/*Test`, `config/*Test` | — |
| component | `LangToggleTests`, … | `component` |
| api | `ReferenceApiTests` | `api` |
| e2e | `HomeSmokeTests` | `smoke` |

```bash
./gradlew testUnit -DpyramidStand=reference_local
./gradlew testApi -DpyramidStand=reference_local
./gradlew testE2e -Denv=reference_local_e2e
```

Env profiles: `python ../scripts/gen-env-configs.py`
