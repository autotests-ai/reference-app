"""Shared page objects — mirrors Java TestBase fields."""

from __future__ import annotations

import pytest
from selenium.webdriver.remote.webdriver import WebDriver

from config import TestConfig
from pages.header_component import HeaderComponent
from pages.home_page import HomePage
from pages.login_page import LoginPage
from pages.register_page import RegisterPage


@pytest.fixture
def login_page(driver: WebDriver, config: TestConfig) -> LoginPage:
    return LoginPage(driver, config)


@pytest.fixture
def register_page(driver: WebDriver, config: TestConfig) -> RegisterPage:
    return RegisterPage(driver, config)


@pytest.fixture
def home_page(driver: WebDriver, config: TestConfig) -> HomePage:
    return HomePage(driver, config)


@pytest.fixture
def header(driver: WebDriver, config: TestConfig) -> HeaderComponent:
    return HeaderComponent(driver, config)
