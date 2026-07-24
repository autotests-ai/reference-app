from __future__ import annotations

import allure
from selenium.webdriver.common.by import By

from pages.base import BasePage


class HomePage(BasePage):
    LAYOUT = (By.CSS_SELECTOR, "[data-testid='reference-layout']")
    HEALTH = (By.CSS_SELECTOR, "[data-testid='health-status']")
    ITEMS = (By.CSS_SELECTOR, "[data-testid='items-list']")
    WELCOME = (By.CSS_SELECTOR, "[data-testid='welcome-message']")
    WELCOME_PANEL = (By.CSS_SELECTOR, "[data-testid='welcome-panel']")
    LOGOUT = (By.CSS_SELECTOR, "[data-testid='logout-button']")

    @allure.step("Open home page")
    def open_page(self) -> HomePage:
        self.open_path("/")
        return self

    @allure.step("Verify home layout is mounted")
    def should_show_layout(self) -> HomePage:
        self.wait_visible(*self.LAYOUT)
        self.wait_visible(*self.ITEMS)
        return self

    @allure.step("Verify health status contains: {text_fragment}")
    def should_show_health_text(self, text_fragment: str) -> HomePage:
        self.wait_text_contains(*self.HEALTH, text_fragment)
        return self

    @allure.step("Verify items list contains: {text_fragment}")
    def should_show_item_text(self, text_fragment: str) -> HomePage:
        self.wait_text_contains(*self.ITEMS, text_fragment)
        return self

    @allure.step("Verify welcome message: {message}")
    def should_have_welcome_message(self, message: str) -> HomePage:
        self.wait_visible(*self.WELCOME_PANEL)
        self.wait_text_contains(*self.WELCOME, message)
        return self

    @allure.step("Click logout button")
    def click_logout_button(self):
        from pages.login_page import LoginPage
        from urllib.parse import urlparse

        self.js_click(*self.LOGOUT)

        def _on_login(driver):
            path = urlparse(driver.current_url).path
            return path.rstrip("/").endswith("login")

        self.wait().until(_on_login)
        return LoginPage(self.driver, self.config)
