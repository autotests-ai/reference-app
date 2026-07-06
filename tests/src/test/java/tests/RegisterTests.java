package tests;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import pages.RegisterPage;

@Layer("e2e")
@Epic("Authentication")
@Feature("Register")
@DisplayName("Register")
class RegisterTests extends TestBase {

    private final RegisterPage registerPage = new RegisterPage();

    @Test
    @Tag("smoke")
    @Tag("positive")
    @DisplayName("New user can register and land on home")
    void shouldRegisterNewUser() {
        String username = "user_" + java.util.UUID.randomUUID().toString().substring(0, 8);

        registerPage.openPage()
                .fillAndSubmitForm(username, "password123", "password123")
                .shouldHaveWelcomeMessage("Welcome, " + username + "!");
    }
}
