"""Allure attachments — parity with Java allure.Attachments."""

from __future__ import annotations

import allure
from selenium.webdriver.remote.webdriver import WebDriver

import har_capture
import har_viewer
from config import TestConfig


def browser_console_logs(driver: WebDriver) -> None:
    try:
        entries = har_capture.get_logs(driver, "browser")
        text = (
            "\n".join(f"{e.get('level')}: {e.get('message')}" for e in entries)
            or "(no console messages)"
        )
    except Exception:
        text = "(browser logs unavailable)"
    allure.attach(text, name="Browser console logs", attachment_type=allure.attachment_type.TEXT)


def page_source(driver: WebDriver) -> None:
    try:
        html = driver.page_source or ""
    except Exception:
        html = ""
    allure.attach(html, name="Page source", attachment_type=allure.attachment_type.HTML)


def last_screenshot(driver: WebDriver) -> None:
    try:
        png = driver.get_screenshot_as_png()
    except Exception:
        return
    allure.attach(png, name="Last screenshot", attachment_type=allure.attachment_type.PNG)


def video(config: TestConfig, session_id: str) -> None:
    if not session_id:
        return
    video_url = f"{config.video_folder}{session_id}.mp4"
    html = (
        "<html><body><video width='100%' height='100%' controls autoplay>"
        f"<source src='{video_url}' type='video/mp4'></video></body></html>"
    )
    allure.attach(html, name="Video", attachment_type=allure.attachment_type.HTML)


def har_logs(driver: WebDriver, browser: str) -> None:
    if not har_capture.supports_browser(browser):
        return
    raw = har_capture.collect_har_json(driver)
    if not raw:
        return
    allure.attach(
        raw,
        name="capture.har",
        attachment_type=allure.attachment_type.JSON,
        extension="har",
    )
    allure.attach(
        har_viewer.render(raw),
        name="HAR Viewer",
        attachment_type=allure.attachment_type.HTML,
    )
