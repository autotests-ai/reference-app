"""Config loader — mirrors Java ConfigReader / properties for the Python stack."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent
if not os.environ.get("CI"):
    load_dotenv(_ROOT / ".env")


def _bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _attach_full() -> bool:
    return _bool("ATTACH_FULL")


@dataclass(frozen=True)
class TestConfig:
    base_url: str
    api_base_url: str
    browser: str
    browser_version: str
    browser_size: str
    headless: bool
    remote_url: str
    enable_vnc: bool
    enable_video: bool
    enable_har: bool
    video_folder: str
    attach_browser_console_logs: bool
    attach_har_logs: bool
    attach_last_screenshot: bool
    attach_page_source: bool
    attach_video: bool


def load_config() -> TestConfig:
    base = os.environ.get("BASE_URL", "https://reference-app.autotests.ai/").rstrip("/") + "/"
    api = os.environ.get("API_BASE_URL", base).rstrip("/") + "/"
    full = _attach_full()
    enable_video = full or _bool("ENABLE_VIDEO")
    enable_har = full or _bool("ENABLE_HAR")
    video_folder = os.environ.get("VIDEO_FOLDER", "https://selenoid.qa.guru/video/")
    if video_folder and not video_folder.endswith("/"):
        video_folder += "/"
    return TestConfig(
        base_url=base,
        api_base_url=api,
        browser=os.environ.get("BROWSER", "chrome"),
        browser_version=os.environ.get("BROWSER_VERSION", "148.0"),
        browser_size=os.environ.get("BROWSER_SIZE", "1740x1080"),
        headless=_bool("HEADLESS", True),
        remote_url=os.environ.get("REMOTE_URL", "").strip(),
        enable_vnc=full or _bool("ENABLE_VNC"),
        enable_video=enable_video,
        enable_har=enable_har,
        video_folder=video_folder,
        attach_browser_console_logs=full or _bool("ATTACH_BROWSER_CONSOLE_LOGS"),
        attach_har_logs=full or _bool("ATTACH_HAR_LOGS") or enable_har,
        attach_last_screenshot=full or _bool("ATTACH_LAST_SCREENSHOT"),
        attach_page_source=full or _bool("ATTACH_PAGE_SOURCE"),
        attach_video=full or _bool("ATTACH_VIDEO") or enable_video,
    )
