from __future__ import annotations

import allure
from selenium.webdriver.common.by import By

from pages.base import BasePage


class RegisterPage(BasePage):
    LOGIN_INPUT = (By.CSS_SELECTOR, "[data-testid='login-input']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "[data-testid='password-input']")
    CONFIRM_PASSWORD = (By.CSS_SELECTOR, "[data-testid='confirm-password-input']")
    SUBMIT = (By.CSS_SELECTOR, "[data-testid='submit-button']")
    FORM_TITLE = (By.CSS_SELECTOR, "[data-testid='register-form-title']")
    ERROR = (By.CSS_SELECTOR, "[data-testid='error-message']")
    LOGIN_LINK = (By.CSS_SELECTOR, "[data-testid='login-link']")
    REGISTER_FORM = (By.CSS_SELECTOR, "[data-testid='register-form']")

    @allure.step("Open register page")
    def open_page(self) -> RegisterPage:
        self.open_path("/register")
        return self

    @allure.step("Click 'Login' link under the register form")
    def click_login_link(self):
        from pages.login_page import LoginPage

        self.find(*self.LOGIN_LINK).click()
        return LoginPage(self.driver, self.config)

    @allure.step("Fill and submit register form")
    def fill_and_submit_form(self, username: str, password: str, confirm_password: str):
        self.type_username(username)
        self.type_password(password)
        self.type_confirm_password(confirm_password)
        return self.submit()

    @allure.step("Type username: {username}")
    def type_username(self, username: str) -> RegisterPage:
        self.fill(*self.LOGIN_INPUT, username)
        return self

    @allure.step("Type password")
    def type_password(self, password: str) -> RegisterPage:
        self.fill(*self.PASSWORD_INPUT, password)
        return self

    @allure.step("Type confirm password")
    def type_confirm_password(self, confirm_password: str) -> RegisterPage:
        self.fill(*self.CONFIRM_PASSWORD, confirm_password)
        return self

    @allure.step("Submit register form")
    def submit(self):
        from pages.home_page import HomePage

        self.find(*self.SUBMIT).click()
        self.wait_url_is_home()
        return HomePage(self.driver, self.config)

    @allure.step("Verify register form is mounted")
    def should_show_register_form(self) -> RegisterPage:
        self.wait_visible(*self.FORM_TITLE)
        self.wait_visible(*self.LOGIN_INPUT)
        self.wait_visible(*self.PASSWORD_INPUT)
        self.wait_visible(*self.CONFIRM_PASSWORD)
        self.wait_visible(*self.SUBMIT)
        return self
