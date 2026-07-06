package tests;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("integration")
@Epic("Authentication")
@Feature("Login embed")
@DisplayName("Login embed")
class LoginEmbedTests extends TestBase {

    @Test
    @Tag("mount")
    @DisplayName("Embedded header is visible on login page")
    void embeddedHeaderIsVisibleOnLoginPage() {
        loginPage.openPage()
                .shouldShowEmbeddedHeader()
                .shouldShowLoginForm()
                .shouldHaveFormTitle("Login Form");
    }
}
