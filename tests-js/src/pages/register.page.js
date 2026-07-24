exports.RegisterPage = class RegisterPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.registerForm = page.getByTestId('register-form');
    this.loginInput = page.getByTestId('login-input');
    this.passwordInput = page.getByTestId('password-input');
    this.confirmPasswordInput = page.getByTestId('confirm-password-input');
    this.submitButton = page.getByTestId('submit-button');
    this.formTitle = page.getByTestId('register-form-title');
    this.errorMessage = page.getByTestId('error-message');
    this.loginLink = page.getByTestId('login-link');
  }

  async open() {
    await this.page.goto('/register');
  }

  async signup(username, password, confirmPassword = password) {
    await this.loginInput.fill(username);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
    await this.page.waitForURL((url) => {
      const path = new URL(url).pathname;
      return path === '/' || path === '';
    });
  }

  async clickLoginLink() {
    await this.loginLink.click();
  }
};
