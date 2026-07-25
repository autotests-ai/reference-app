# reference-app — tests-selenium (Selenium)

UI smoke sibling of the Java Selenide pyramid ([`../tests/`](../tests/)). Same product flows as [`../tests-python/`](../tests-python/) (Selenium + fluent page objects), but Java · Gradle · JUnit 5 · Allure.

**Canon stays Selenide** — this stack is smoke-only (no visual/component pyramid).

## Quick start

```bash
cd tests-selenium
./gradlew test
```

Defaults (like Python sibling):

| Key | Default |
|-----|---------|
| `baseUrl` / `BASE_URL` | `https://reference-app.autotests.ai/` |
| `browserVersion` | `148.0` (Chrome for Testing via `LocalChromePin`) |
| `headless` | `true` |

Local Chrome 148 must be installed under `~/.local/share/chrome-for-testing` (same as Selenide canon).

Against local compose:

```bash
./gradlew test -DbaseUrl=http://localhost:8080/
```

## Remote (Selenoid WebDriver)

```bash
export BASE_URL=https://reference-app.autotests.ai/
export REMOTE_URL=https://user1:1234@selenoid.qa.guru/wd/hub
export BROWSER_VERSION=148.0
./gradlew test
```

Or Gradle props: `-DremoteUrl=… -DbrowserVersion=148.0`.

## Allure

```bash
./gradlew test -DallureReportMode=allure3
# results: build/allure-results
```

## Coverage (smoke)

| Suite | Mirrors |
|-------|---------|
| `HomeTests` | tests-python `test_home` |
| `LoginTests` | tests-python `test_login` |
| `RegisterTests` | tests-python `test_register` |
| `LogoutTests` | tests-python `test_logout` |
| `HeaderActiveNavTests` | tests-python `test_header_active_nav` |
