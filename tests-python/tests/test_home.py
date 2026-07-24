import allure
import pytest

from pages.home_page import HomePage


@allure.epic("Home")
@allure.feature("Home load")
@allure.story("Home page load")
@allure.title("Home")
class TestHome:
    @allure.title("Page load fetches health and items from API")
    @pytest.mark.smoke
    def test_page_load_fetches_items(self, home_page: HomePage):
        (
            home_page.open_page()
            .should_show_layout()
            .should_show_health_text("service: reference-app")
            .should_show_item_text("Alpha")
        )
