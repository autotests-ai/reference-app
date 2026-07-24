exports.LoginPage = class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.loginForm = page.getByTestId('login-form');
    this.loginInput = page.getByTestId('login-input');
    this.passwordInput = page.getByTestId('password-input');
    this.submitButton = page.getByTestId('submit-button');
    this.formTitle = page.getByTestId('login-form-title');
    this.errorMessage = page.getByTestId('error-message');
    this.registerLink = page.getByTestId('register-link');
  }

  async open() {
    await this.page.goto('/login');
  }

  async login(username, password) {
    await this.loginInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL((url) => {
      const path = new URL(url).pathname;
      return path === '/' || path === '';
    });
  }

  async typeUsername(username) {
    await this.loginInput.fill(username);
  }

  async typePassword(password) {
    await this.passwordInput.fill(password);
  }

  async submitExpectingError() {
    await this.submitButton.click();
    await this.errorMessage.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async clickRegisterLink() {
    await this.registerLink.click();
  }
};
