# reference-app — tests-js (Playwright)

UI smoke in [RealWorldTests](https://github.com/KurenkoValentina/RealWorldTests) style: App facade, page objects, UserBuilder, `webApp` fixture, Allure via `allure-playwright`.

## Quick start

```bash
cd tests-js
cp .env.example .env   # UI_URL=https://reference-app.autotests.ai
npm ci
npx playwright install chromium   # local only; skip when using PW_WS_ENDPOINT
npm test
```

## Remote (Selenoid Playwright)

```bash
export UI_URL=https://reference-app.autotests.ai
export PW_WS_ENDPOINT='wss://selenoid.qa.guru/playwright/playwright-chromium/1.61.1?accessKey=…'
npm test
```

## Allure

```bash
npm run allureG && npm run allureO
```

Results: `allure-results/`. Jenkins freestyle: `reference-app-tests-freestyle-js-playwright`.
