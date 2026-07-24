from __future__ import annotations

from urllib.parse import urlparse

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from config import TestConfig


class BasePage:
    def __init__(self, driver: WebDriver, config: TestConfig, timeout: float = 10.0):
        self.driver = driver
        self.config = config
        self.timeout = timeout

    def wait(self) -> WebDriverWait:
        return WebDriverWait(self.driver, self.timeout)

    def open_path(self, path: str) -> None:
        base = self.config.base_url.rstrip("/")
        suffix = path if path.startswith("/") else f"/{path}"
        self.driver.get(f"{base}{suffix}")

    def find(self, by: By, value: str):
        return self.driver.find_element(by, value)

    def wait_visible(self, by: By, value: str):
        return self.wait().until(EC.visibility_of_element_located((by, value)))

    def wait_text_contains(self, by: By, value: str, fragment: str):
        def _has_text(driver: WebDriver) -> bool:
            els = driver.find_elements(by, value)
            if not els:
                return False
            return fragment in (els[0].text or "")

        self.wait().until(_has_text)
        return self.find(by, value)

    def fill(self, by: By, value: str, text: str) -> None:
        """Reliable input fill for React controlled fields (≈ Selenide setValue)."""
        el = self.wait_visible(by, value)
        el.click()
        platform = (self.driver.capabilities.get("platformName") or "").lower()
        modifier = Keys.COMMAND if "mac" in platform else Keys.CONTROL
        el.send_keys(modifier, "a")
        el.send_keys(Keys.BACKSPACE)
        el.send_keys(text)

    def wait_url_is_home(self) -> None:
        expected = urlparse(self.config.base_url)

        def _at_home(driver: WebDriver) -> bool:
            current = urlparse(driver.current_url)
            return current.netloc == expected.netloc and current.path in {"", "/"}

        self.wait().until(_at_home)
