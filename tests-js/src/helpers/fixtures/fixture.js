const { test: base } = require('@playwright/test');
const { App } = require('../../pages/app');

exports.test = base.extend({
  webApp: async ({ page }, use) => {
    const app = new App(page);
    await use(app);
  },
});
