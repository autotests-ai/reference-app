"""Driver fixture ≈ Java TestBase (Selenide Configuration + remote Selenoid)."""

from __future__ import annotations

import allure
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.remote.webdriver import WebDriver

import attachments
import har_capture
from config import TestConfig, load_config


@pytest.fixture(scope="session")
def config() -> TestConfig:
    return load_config()


@pytest.fixture
def driver(config: TestConfig) -> WebDriver:
    options = ChromeOptions()
    options.add_argument("--window-size=" + config.browser_size.replace("x", ","))
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    capture_har = config.enable_har or config.attach_har_logs
    if (capture_har or config.attach_browser_console_logs) and har_capture.supports_browser(
        config.browser
    ):
        har_capture.enable_performance_logging(
            options, browser_logs=config.attach_browser_console_logs
        )

    if config.remote_url:
        # Match Java TestBase: headless via selenoid:options, not Chrome flags
        options.set_capability("browserVersion", config.browser_version)
        options.set_capability(
            "selenoid:options",
            {
                "enableVNC": config.enable_vnc,
                "enableVideo": config.enable_video,
                "headless": config.headless,
                "name": "reference-app-python",
            },
        )
        drv: WebDriver = webdriver.Remote(
            command_executor=config.remote_url,
            options=options,
        )
    else:
        if config.headless:
            options.add_argument("--headless=new")
        drv = webdriver.Chrome(options=options)

    drv.implicitly_wait(0)
    yield drv
    drv.quit()


@pytest.hookimpl(hookwrapper=True, tryfirst=True)
def pytest_runtest_makereport(item, call):
    """Attach on the test result (not fixture container) — parity with Java afterEach."""
    outcome = yield
    report = outcome.get_result()
    if report.when != "call":
        return
    drv = item.funcargs.get("driver")
    cfg = item.funcargs.get("config")
    if drv is None or cfg is None:
        return
    try:
        _attach_after(drv, cfg)
    except Exception:
        pass


def _attach_after(drv: WebDriver, config: TestConfig) -> None:
    session_id = getattr(drv, "session_id", "") or ""

    if config.attach_browser_console_logs:
        attachments.browser_console_logs(drv)
    if config.attach_page_source:
        attachments.page_source(drv)
    if config.attach_har_logs:
        attachments.har_logs(drv, config.browser)
    if config.attach_last_screenshot:
        attachments.last_screenshot(drv)
    elif hasattr(drv, "get_screenshot_as_png"):
        # Lean default: keep previous final-screenshot behaviour
        try:
            allure.attach(
                drv.get_screenshot_as_png(),
                name="final-screenshot",
                attachment_type=allure.attachment_type.PNG,
            )
        except Exception:
            pass
    if config.enable_video and config.attach_video:
        attachments.video(config, session_id)
