from __future__ import annotations

import allure
from selenium.webdriver.common.by import By

from pages.base import BasePage


class LoginPage(BasePage):
    LOGIN_INPUT = (By.CSS_SELECTOR, "[data-testid='login-input']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "[data-testid='password-input']")
    SUBMIT = (By.CSS_SELECTOR, "[data-testid='submit-button']")
    FORM_TITLE = (By.CSS_SELECTOR, "[data-testid='login-form-title']")
    ERROR = (By.CSS_SELECTOR, "[data-testid='error-message']")
    REGISTER_LINK = (By.CSS_SELECTOR, "[data-testid='register-link']")

    @allure.step("Open login page")
    def open_page(self) -> LoginPage:
        self.open_path("/login")
        return self

    @allure.step("Click 'Register' link under the login form")
    def click_register_link(self):
        from pages.register_page import RegisterPage

        self.find(*self.REGISTER_LINK).click()
        return RegisterPage(self.driver, self.config)

    @allure.step("Fill and submit form")
    def fill_and_submit_form(self, username: str, password: str):
        self.type_username(username)
        self.type_password(password)
        return self.submit()

    @allure.step("Type username: {username}")
    def type_username(self, username: str) -> LoginPage:
        self.fill(*self.LOGIN_INPUT, username)
        return self

    @allure.step("Type password")
    def type_password(self, password: str) -> LoginPage:
        self.fill(*self.PASSWORD_INPUT, password)
        return self

    @allure.step("Submit login form")
    def submit(self):
        from pages.home_page import HomePage

        self.find(*self.SUBMIT).click()
        self.wait_url_is_home()
        return HomePage(self.driver, self.config)

    @allure.step("Submit login form expecting validation error")
    def submit_expecting_error(self) -> LoginPage:
        self.find(*self.SUBMIT).click()
        self.wait_visible(*self.ERROR)
        return self

    @allure.step("Verify login form is mounted")
    def should_show_login_form(self) -> LoginPage:
        self.wait_visible(*self.FORM_TITLE)
        self.wait_visible(*self.LOGIN_INPUT)
        self.wait_visible(*self.PASSWORD_INPUT)
        self.wait_visible(*self.SUBMIT)
        return self

    @allure.step("Verify form title message: {message}")
    def should_have_form_title(self, message: str) -> LoginPage:
        el = self.wait_visible(*self.FORM_TITLE)
        assert message in el.text
        return self

    @allure.step("Verify error message: {message}")
    def should_have_error_message(self, message: str) -> LoginPage:
        self.wait_text_contains(*self.ERROR, message)
        return self
