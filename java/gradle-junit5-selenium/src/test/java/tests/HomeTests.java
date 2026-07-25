package tests;

import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Epic("Home")
@Feature("Home load")
@Story("Home page load")
@DisplayName("Home")
class HomeTests extends TestBase {

    @Test
    @Tag("smoke")
    @Severity(SeverityLevel.BLOCKER)
    @DisplayName("Page load fetches health and items from API")
    void pageLoadFetchesItems() {
        homePage.openPage()
                .shouldShowLayout()
                .shouldShowHealthText("service: reference-app")
                .shouldShowItemText("Alpha");
    }
}
