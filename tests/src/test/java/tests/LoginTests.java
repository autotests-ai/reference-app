package tests;

import annotations.Layer;
import annotations.Manual;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Step;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("e2e")
@Epic("Authentication")
@Feature("Login")
@DisplayName("Login")
class LoginTests extends TestBase {

    @Test
    @Tag("smoke")
    @Tag("positive")
    @DisplayName("User is logged in with valid credentials")
    void shouldLoginWithValidCredentials() {
        loginPage.openPage()
                .fillAndSubmitForm("user1", "password1")
                .shouldHaveWelcomeMessage("Welcome, user1!");
    }

    @Test
    @Manual
    @Layer("manual")
    @Tag("manual")
    @DisplayName("Manual: empty username shows validation error")
    void manualEmptyUsernameShowsValidationError() {
        stepOpenLoginPage();
        stepSubmitWithUsername("");
        stepVerifyValidationErrorVisible();
    }

    @Test
    @Manual
    @Layer("manual")
    @Tag("manual")
    @DisplayName("Manual: empty password shows validation error")
    void manualEmptyPasswordShowsValidationError() {
        stepOpenLoginPage();
        stepSubmitWithPassword("");
        stepVerifyValidationErrorVisible();
    }

    @Test
    @Manual
    @Layer("manual")
    @Tag("manual")
    @DisplayName("Manual: wrong password shows readable error")
    void manualWrongPasswordShowsReadableError() {
        stepOpenLoginPage();
        stepSubmitCredentials("user1", "wrongpassword");
        stepVerifyWrongCredentialsError();
    }

    @Step("Open /login")
    private void stepOpenLoginPage() {
        // Exploratory checklist — execute manually in TestOps
    }

    @Step("Submit with username: {username}")
    private void stepSubmitWithUsername(String username) {
        // Leave password empty or fill as needed
    }

    @Step("Submit with password only")
    private void stepSubmitWithPassword(String password) {
        // Fill username, leave password empty
    }

    @Step("Submit credentials")
    private void stepSubmitCredentials(String username, String password) {
        // Type and submit login form
    }

    @Step("Verify validation error is visible")
    private void stepVerifyValidationErrorVisible() {
        // Assert client-side validation message in [data-testid='error-message']
    }

    @Step("Verify wrong credentials error")
    private void stepVerifyWrongCredentialsError() {
        // Assert message: Wrong login or password
    }
}
