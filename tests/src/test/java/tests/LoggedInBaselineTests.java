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

import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;

@Layer("e2e")
@Tag("visual")
@Epic("Authentication")
@Feature("Logged-in session")
@Suite("Logged-in")
@SubSuite("visual")
@Execution(ExecutionMode.SAME_THREAD)
@DisplayName("Logged-in session visual")
class LoggedInBaselineTests extends TestBase {

    private static final int VIEWPORT_HEIGHT = 900;

    @ParameterizedTest(name = "Logged-in session matches baseline at {0}px")
    @ValueSource(ints = {390, 768, 1280})
    @DisplayName("Logged-in session matches baseline")
    void loggedInSessionMatchesBaseline(int viewportWidth) {
        ViewportHelper.setViewport(viewportWidth, VIEWPORT_HEIGHT);
        loginPage.openPage()
                .fillAndSubmitForm("user1", "password1")
                .shouldHaveWelcomeMessage("Welcome, user1!");

        var sessionPanel = $("[data-testid='session-panel']").shouldBe(visible);
        ScreenshotBaseline.captureAndCompare(
                sessionPanel,
                "logged-in",
                viewportWidth,
                "logged-in-" + viewportWidth);
    }
}
