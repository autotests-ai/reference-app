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


def load_config() -> TestConfig:
    base = os.environ.get("BASE_URL", "https://reference-app.autotests.ai/").rstrip("/") + "/"
    api = os.environ.get("API_BASE_URL", base).rstrip("/") + "/"
    return TestConfig(
        base_url=base,
        api_base_url=api,
        browser=os.environ.get("BROWSER", "chrome"),
        browser_version=os.environ.get("BROWSER_VERSION", "148.0"),
        browser_size=os.environ.get("BROWSER_SIZE", "1740x1080"),
        headless=_bool("HEADLESS", True),
        remote_url=os.environ.get("REMOTE_URL", "").strip(),
        enable_vnc=_bool("ENABLE_VNC", False),
        enable_video=_bool("ENABLE_VIDEO", False),
    )
