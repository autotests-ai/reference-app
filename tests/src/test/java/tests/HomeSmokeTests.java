package tests;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("e2e")
@Epic("Reference App")
@Feature("Home load")
@DisplayName("Home smoke")
class HomeSmokeTests extends TestBase {

    @Test
    @Tag("smoke")
    @DisplayName("Page load fetches health and items from API")
    void pageLoadFetchesItems() {
        homePage.openPage()
                .shouldShowLayout()
                .shouldShowHealthText("service: reference-app")
                .shouldShowItemText("Alpha");
    }
}
