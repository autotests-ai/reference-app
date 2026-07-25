package tests;

import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.util.UUID;

@Epic("Authentication")
@Feature("Register")
@Story("Register")
@DisplayName("Register")
class RegisterTests extends TestBase {

    @Test
    @Tag("smoke")
    @Tag("positive")
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("New user can register and land on home")
    void shouldRegisterNewUser() {
        String username = "user_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        registerPage.openPage()
                .fillAndSubmitForm(username, "password123", "password123")
                .shouldHaveWelcomeMessage("Welcome, " + username + "!");
    }
}
