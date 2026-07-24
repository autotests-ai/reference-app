const { LoginPage, RegisterPage, HomePage, HeaderPage } = require('./index');

/** Facade — one entry for all page objects (RealWorldTests style). */
exports.App = class App {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.login = new LoginPage(page);
    this.register = new RegisterPage(page);
    this.home = new HomePage(page);
    this.header = new HeaderPage(page);
  }
};
