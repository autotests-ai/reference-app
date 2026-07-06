package tests;

import annotations.Layer;
import annotations.SubSuite;
import annotations.Suite;
import helpers.ScreenshotBaseline;
import helpers.ViewportHelper;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.Duration;

import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;

@Layer("e2e")
@Tag("visual")
@Epic("Authentication")
@Feature("Login form")
@Suite("Login")
@SubSuite("visual")
@Execution(ExecutionMode.SAME_THREAD)
@DisplayName("Login form visual")
class LoginBaselineTests extends TestBase {

    private static final int VIEWPORT_HEIGHT = 900;

    @ParameterizedTest(name = "Login form matches baseline at {0}px")
    @ValueSource(ints = {390, 768, 1280})
    @DisplayName("Login form matches baseline")
    void loginFormMatchesBaseline(int viewportWidth) {
        ViewportHelper.setViewport(viewportWidth, VIEWPORT_HEIGHT);
        loginPage.openPage();

        var panel = $("[data-testid='login-form']").shouldBe(visible, Duration.ofSeconds(10));
        ScreenshotBaseline.captureAndCompare(
                panel,
                "login",
                viewportWidth,
                "login-" + viewportWidth);
    }
}
