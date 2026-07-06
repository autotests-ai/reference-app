package tests;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("e2e")
@Epic("Authentication")
@Feature("Logout")
@DisplayName("Logout")
class LogoutTests extends TestBase {

    @Test
    @Tag("smoke")
    @Tag("positive")
    @DisplayName("User can logout after form login")
    void shouldLogoutAfterFormLogin() {
        loginPage.openPage()
                .fillAndSubmitForm("user1", "password1")
                .shouldHaveWelcomeMessage("Welcome, user1!");

        homePage.clickLogoutButton()
                .shouldHaveFormTitle("Login Form");
    }

    @Test
    @Tag("smoke")
    @Tag("positive")
    @DisplayName("User can logout after localStorage authentication")
    void shouldLogoutAfterLocalStorageAuthentication() {
        homePage.openPageWithLocalStorageAuthentication("user1", "password1")
                .shouldHaveWelcomeMessage("Welcome, user1!");

        homePage.clickLogoutButton()
                .shouldHaveFormTitle("Login Form");
    }
}
