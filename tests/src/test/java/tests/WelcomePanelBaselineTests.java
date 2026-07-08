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
@Feature("Welcome panel")
@Suite("Welcome panel")
@SubSuite("visual")
@Execution(ExecutionMode.SAME_THREAD)
@DisplayName("Welcome panel visual")
class WelcomePanelBaselineTests extends TestBase {

    private static final int VIEWPORT_HEIGHT = 900;

    @ParameterizedTest(name = "Welcome panel matches baseline at {0}px")
    @ValueSource(ints = {390, 768, 1280})
    @DisplayName("Welcome panel matches baseline")
    void welcomePanelMatchesBaseline(int viewportWidth) {
        ViewportHelper.setViewport(viewportWidth, VIEWPORT_HEIGHT);
        loginPage.openPage()
                .fillAndSubmitForm("user1", "password1")
                .shouldHaveWelcomeMessage("Welcome, user1!");

        var welcomePanel = $("[data-testid='welcome-panel']").shouldBe(visible);
        ScreenshotBaseline.captureAndCompare(
                welcomePanel,
                "welcome-panel",
                viewportWidth,
                "welcome-panel-" + viewportWidth);
    }
}
