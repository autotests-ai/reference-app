import allure
import pytest

from pages.home_page import HomePage
from pages.login_page import LoginPage


@allure.epic("Authentication")
@allure.feature("Logout")
@allure.story("Logout")
@allure.title("Logout")
class TestLogout:
    @allure.title("User can logout after form login")
    @pytest.mark.smoke
    @pytest.mark.positive
    def test_should_logout_after_form_login(
        self, login_page: LoginPage, home_page: HomePage
    ):
        (
            login_page.open_page()
            .fill_and_submit_form("user1", "password1")
            .should_have_welcome_message("Welcome, user1!")
        )
        home_page.click_logout_button().should_have_form_title("Login Form")
