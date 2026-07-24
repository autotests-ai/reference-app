from __future__ import annotations

import allure
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from pages.base import BasePage


class HeaderComponent(BasePage):
    ROOT = (By.CSS_SELECTOR, "[data-testid='header']")

    @allure.step("Verify header is mounted")
    def should_be_mounted(self) -> HeaderComponent:
        self.wait_visible(*self.ROOT)
        return self

    @allure.step("Verify header nav '{active_testid}' is the only active item")
    def should_have_active_nav(self, active_testid: str) -> HeaderComponent:
        self.should_be_mounted()
        active = self.wait().until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, f"[data-testid='{active_testid}']"))
        )

        def _is_active(_driver) -> bool:
            cls = active.get_attribute("class") or ""
            aria = active.get_attribute("aria-current")
            return "is-active" in cls.split() and aria == "page"

        self.wait().until(_is_active)
        current = self.driver.find_elements(
            By.CSS_SELECTOR, "[data-testid='header-nav'] a[aria-current='page']"
        )
        assert len(current) == 1
        return self
