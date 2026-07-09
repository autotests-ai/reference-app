# Test coverage (stable baseline)

JaCoCo gates enforced in CI (`reference_pyramid` → `local_full`).

| Module | Scope | Line gate | Command |
|--------|-------|-----------|---------|
| `backend/` | Spring services, controllers, filters (excl. `ReferenceApplication`) | **100%** | `./gradlew test jacocoTestCoverageVerification` |
| `tests/` unit slice | `ConfigReader`, `LayoutCss`, `TokensCss` | **100%** | `./gradlew testUnit jacocoTestUnitCoverageVerification -DpyramidStand=reference_local` |

## HTML reports (local)

```bash
cd backend && ./gradlew test jacocoTestReport
open build/reports/jacoco/test/html/index.html

cd tests && ./gradlew testUnit jacocoTestUnitReport -DpyramidStand=reference_local
open build/reports/jacoco/jacocoTestUnitReport/html/index.html
```

## CI artifacts

- `backend-jacoco` — backend HTML/XML
- `pyramid-unit-jacoco` — unit slice HTML/XML

Stable tag: `v0.2.0-coverage` (full local pyramid green + gates above).
