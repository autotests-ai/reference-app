package tests.e2e;

import annotations.Layer;
import helpers.ScreenshotBaseline;
import helpers.ViewportHelper;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import tests.TestBase;

import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.open;

@Layer("e2e")
@Tag("visual")
@Epic("Home")
@Feature("Home layout")
@Execution(ExecutionMode.SAME_THREAD)
@DisplayName("Home layout visual")
class HomeLayoutBaselineTests extends TestBase {

    private static final int VIEWPORT_WIDTH = 1280;
    private static final int VIEWPORT_HEIGHT = 900;

    @BeforeEach
    void openHome() {
        ViewportHelper.setViewport(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        open("/");
        $("[data-testid='reference-layout']").shouldBe(visible);
        $("[data-testid='health-status']").shouldBe(visible);
    }

    @Test
    @DisplayName("Home layout matches baseline at 1280px")
    void homeLayoutMatchesBaseline() {
        var layout = $("[data-testid='reference-layout']").shouldBe(visible);
        ScreenshotBaseline.captureAndCompare(
                layout,
                "home-layout",
                VIEWPORT_WIDTH,
                "home-layout-" + VIEWPORT_WIDTH);
    }
}
