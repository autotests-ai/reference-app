import allure
import pytest

from pages.header_component import HeaderComponent
from pages.login_page import LoginPage
from pages.register_page import RegisterPage


@allure.epic("Navigation")
@allure.feature("Header active item")
@allure.story("Header active nav follows the route")
@allure.title("Header active nav follows the route")
class TestHeaderActiveNav:
    @allure.title("Direct /login load highlights Login")
    @pytest.mark.smoke
    def test_direct_login_load_highlights_login(
        self, login_page: LoginPage, header: HeaderComponent
    ):
        login_page.open_page()
        header.should_have_active_nav("header-nav-login")

    @allure.title("Direct /register load highlights Register")
    @pytest.mark.smoke
    def test_direct_register_load_highlights_register(
        self, register_page: RegisterPage, header: HeaderComponent
    ):
        register_page.open_page()
        header.should_have_active_nav("header-nav-register")

    @allure.title("In-form link Register -> Login re-syncs the active item")
    @pytest.mark.smoke
    def test_in_form_link_from_register_to_login_syncs_header(
        self, register_page: RegisterPage, header: HeaderComponent
    ):
        register_page.open_page()
        header.should_have_active_nav("header-nav-register")
        register_page.click_login_link().should_show_login_form()
        header.should_have_active_nav("header-nav-login")

    @allure.title("In-form link Login -> Register re-syncs the active item")
    @pytest.mark.smoke
    def test_in_form_link_from_login_to_register_syncs_header(
        self, login_page: LoginPage, header: HeaderComponent
    ):
        login_page.open_page()
        header.should_have_active_nav("header-nav-login")
        login_page.click_register_link().should_show_register_form()
        header.should_have_active_nav("header-nav-register")
