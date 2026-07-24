import uuid

import allure
import pytest

from pages.register_page import RegisterPage


@allure.epic("Authentication")
@allure.feature("Register")
@allure.story("Register")
@allure.title("Register")
class TestRegister:
    @allure.title("New user can register and land on home")
    @pytest.mark.smoke
    @pytest.mark.positive
    def test_should_register_new_user(self, register_page: RegisterPage):
        username = f"user_{uuid.uuid4().hex[:8]}"
        (
            register_page.open_page()
            .fill_and_submit_form(username, "password123", "password123")
            .should_have_welcome_message(f"Welcome, {username}!")
        )
