exports.HomePage = class HomePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.layout = page.getByTestId('reference-layout');
    this.healthStatus = page.getByTestId('health-status');
    this.itemsList = page.getByTestId('items-list');
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.welcomePanel = page.getByTestId('welcome-panel');
    this.logoutButton = page.getByTestId('logout-button');
  }

  async open() {
    await this.page.goto('/');
  }

  async logout() {
    await this.logoutButton.click();
  }

  getWelcomeText() {
    return this.welcomeMessage;
  }
};
