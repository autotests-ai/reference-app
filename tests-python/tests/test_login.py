import allure
import pytest

from pages.login_page import LoginPage

LOGIN_REQUIRED = "Login is required (minimum 3 characters)"
PASSWORD_REQUIRED = "Password is required (minimum 6 characters)"
WRONG_CREDENTIALS = "Wrong login or password"


@allure.epic("Authentication")
@allure.feature("Login")
@allure.story("Login scenarios")
@allure.title("Login")
class TestLogin:
    @allure.title("User is logged in with valid credentials")
    @pytest.mark.smoke
    @pytest.mark.positive
    def test_should_login_with_valid_credentials(self, login_page: LoginPage):
        (
            login_page.open_page()
            .fill_and_submit_form("user1", "password1")
            .should_have_welcome_message("Welcome, user1!")
        )

    @allure.title("Empty username shows validation error")
    @pytest.mark.smoke
    @pytest.mark.negative
    def test_should_show_validation_error_when_username_is_empty(self, login_page: LoginPage):
        (
            login_page.open_page()
            .type_password("password1")
            .submit_expecting_error()
            .should_have_error_message(LOGIN_REQUIRED)
        )

    @allure.title("Empty password shows validation error")
    @pytest.mark.smoke
    @pytest.mark.negative
    def test_should_show_validation_error_when_password_is_empty(self, login_page: LoginPage):
        (
            login_page.open_page()
            .type_username("user1")
            .submit_expecting_error()
            .should_have_error_message(PASSWORD_REQUIRED)
        )

    @allure.title("Wrong password shows readable error")
    @pytest.mark.smoke
    @pytest.mark.negative
    def test_should_show_error_when_password_is_wrong(self, login_page: LoginPage):
        (
            login_page.open_page()
            .type_username("user1")
            .type_password("wrongpassword")
            .submit_expecting_error()
            .should_have_error_message(WRONG_CREDENTIALS)
        )
