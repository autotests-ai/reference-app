# Test coverage (stable baseline)

JaCoCo gates enforced in CI (`reference_github-pyramid` → `ci-pyramid` / `ci_pyramid`).

| Module | Scope | Line gate | Command |
|--------|-------|-----------|---------|
| `backend/` | Spring services, controllers, filters (excl. `ReferenceApplication`) | **100%** | `./gradlew test jacocoTestCoverageVerification` |
| `tests/` unit slice | `ConfigReader`, `LayoutCss`, `TokensCss` | **100%** | `./gradlew testUnit jacocoTestUnitCoverageVerification -DpyramidStand=reference_ci` |

## HTML reports (local)

```bash
cd backend && ./gradlew test jacocoTestReport
open build/reports/jacoco/test/html/index.html

cd tests && ./gradlew testUnit jacocoTestUnitReport -DpyramidStand=reference_ci
open build/reports/jacoco/jacocoTestUnitReport/html/index.html
```

## CI artifacts

- `backend-jacoco` — backend HTML/XML
- `pyramid-unit-jacoco` — unit slice HTML/XML

Stable tag: `v0.2.1` (CI pyramid + prod pyramid green, 20 component tests, `reference_ci` stands).

Previous: `v0.2.0-coverage` (JaCoCo 100% gates only).
