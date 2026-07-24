"""Driver fixture ≈ Java TestBase (Selenide Configuration + remote Selenoid)."""

from __future__ import annotations

import allure
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.remote.webdriver import WebDriver

from config import TestConfig, load_config


@pytest.fixture(scope="session")
def config() -> TestConfig:
    return load_config()


@pytest.fixture
def driver(config: TestConfig) -> WebDriver:
    options = ChromeOptions()
    if config.headless:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=" + config.browser_size.replace("x", ","))
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    if config.remote_url:
        options.set_capability("browserVersion", config.browser_version)
        options.set_capability(
            "selenoid:options",
            {
                "enableVNC": config.enable_vnc,
                "enableVideo": config.enable_video,
                "name": "reference-app-python",
            },
        )
        drv: WebDriver = webdriver.Remote(
            command_executor=config.remote_url,
            options=options,
        )
    else:
        drv = webdriver.Chrome(options=options)

    drv.implicitly_wait(0)
    yield drv
    try:
        if hasattr(drv, "get_screenshot_as_png"):
            allure.attach(
                drv.get_screenshot_as_png(),
                name="final-screenshot",
                attachment_type=allure.attachment_type.PNG,
            )
    except Exception:
        pass
    drv.quit()
