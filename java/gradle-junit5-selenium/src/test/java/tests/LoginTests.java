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
@Feature("Login")
@Story("Login scenarios")
@DisplayName("Login")
class LoginTests extends TestBase {

    private static final String LOGIN_REQUIRED = "Login is required (minimum 3 characters)";
    private static final String PASSWORD_REQUIRED = "Password is required (minimum 6 characters)";
    private static final String WRONG_CREDENTIALS = "Wrong login or password";

    @Test
    @Tag("smoke")
    @Tag("positive")
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("User is logged in with valid credentials")
    void shouldLoginWithValidCredentials() {
        loginPage.openPage()
                .fillAndSubmitForm("user1", "password1")
                .shouldHaveWelcomeMessage("Welcome, user1!");
    }

    @Test
    @Tag("smoke")
    @Tag("negative")
    @Severity(SeverityLevel.NORMAL)
    @DisplayName("Empty username shows validation error")
    void shouldShowValidationErrorWhenUsernameIsEmpty() {
        loginPage.openPage()
                .typePassword("password1")
                .submitExpectingError()
                .shouldHaveErrorMessage(LOGIN_REQUIRED);
    }

    @Test
    @Tag("smoke")
    @Tag("negative")
    @Severity(SeverityLevel.NORMAL)
    @DisplayName("Empty password shows validation error")
    void shouldShowValidationErrorWhenPasswordIsEmpty() {
        loginPage.openPage()
                .typeUsername("user1")
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_REQUIRED);
    }

    @Test
    @Tag("smoke")
    @Tag("negative")
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("Wrong password shows readable error")
    void shouldShowErrorWhenPasswordIsWrong() {
        loginPage.openPage()
                .typeUsername("user1")
                .typePassword("wrongpassword")
                .submitExpectingError()
                .shouldHaveErrorMessage(WRONG_CREDENTIALS);
    }
}
