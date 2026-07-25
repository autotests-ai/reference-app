package tests;

import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Epic("Navigation")
@Feature("Header active item")
@Story("Header active nav follows the route")
@DisplayName("Header active nav follows the route")
class HeaderActiveNavTests extends TestBase {

    @Test
    @Tag("smoke")
    @Severity(SeverityLevel.MINOR)
    @DisplayName("Direct /login load highlights Login")
    void directLoginLoadHighlightsLogin() {
        loginPage.openPage();
        header.shouldHaveActiveNav("header-nav-login");
    }

    @Test
    @Tag("smoke")
    @Severity(SeverityLevel.MINOR)
    @DisplayName("Direct /register load highlights Register")
    void directRegisterLoadHighlightsRegister() {
        registerPage.openPage();
        header.shouldHaveActiveNav("header-nav-register");
    }

    @Test
    @Tag("smoke")
    @Severity(SeverityLevel.MINOR)
    @DisplayName("In-form link Register -> Login re-syncs the active item")
    void inFormLinkFromRegisterToLoginSyncsHeader() {
        registerPage.openPage();
        header.shouldHaveActiveNav("header-nav-register");
        registerPage.clickLoginLink().shouldShowLoginForm();
        header.shouldHaveActiveNav("header-nav-login");
    }

    @Test
    @Tag("smoke")
    @Severity(SeverityLevel.MINOR)
    @DisplayName("In-form link Login -> Register re-syncs the active item")
    void inFormLinkFromLoginToRegisterSyncsHeader() {
        loginPage.openPage();
        header.shouldHaveActiveNav("header-nav-login");
        loginPage.clickRegisterLink().shouldShowRegisterForm();
        header.shouldHaveActiveNav("header-nav-register");
    }
}
