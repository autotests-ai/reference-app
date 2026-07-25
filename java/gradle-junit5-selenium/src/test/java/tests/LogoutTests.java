package tests;

import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Epic("Authentication")
@Feature("Logout")
@Story("Logout")
@DisplayName("Logout")
class LogoutTests extends TestBase {

    @Test
    @Tag("smoke")
    @Tag("positive")
    @Severity(SeverityLevel.NORMAL)
    @DisplayName("User can logout after form login")
    void shouldLogoutAfterFormLogin() {
        homePage = loginPage.openPage()
                .fillAndSubmitForm("user1", "password1")
                .shouldHaveWelcomeMessage("Welcome, user1!");
        homePage.clickLogoutButton().shouldHaveFormTitle("Login Form");
    }
}
