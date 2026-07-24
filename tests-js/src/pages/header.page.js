exports.HeaderPage = class HeaderPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.root = page.getByTestId('header');
  }

  activeNav(testid) {
    return this.page.getByTestId(testid);
  }

  currentPageLinks() {
    return this.page.locator("[data-testid='header-nav'] a[aria-current='page']");
  }
};
