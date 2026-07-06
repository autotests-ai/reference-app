package tests.component;

import annotations.Layer;
import annotations.SubSuite;
import annotations.Suite;
import config.ConfigReader;
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

import com.codeborne.selenide.Configuration;

import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.open;

@Layer("component")
@Tag("visual")
@Epic("Component Catalog")
@Feature("Plaque field grid")
@Suite("Plaque field")
@SubSuite("visual")
@Execution(ExecutionMode.SAME_THREAD)
@DisplayName("Plaque field grid mixed visual")
class PlaqueFieldGridMixedBaselineTests extends TestBase {

    private static final int VIEWPORT_WIDTH = 1280;
    private static final int VIEWPORT_HEIGHT = 900;

    @BeforeEach
    void openCatalog() {
        Configuration.baseUrl = ConfigReader.resolveComponentCatalogUrl();
        ViewportHelper.setViewport(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        open("/components.html");
        $("[data-testid='section-plaque-field']").shouldBe(visible);
    }

    @Test
    @DisplayName("Mixed grid seg matches baseline at 1280px")
    void mixedGridMatchesBaseline() {
        var grid = $("[data-testid='plaque-field-grid-mixed']").shouldBe(visible);
        grid.scrollIntoView(true);
        ScreenshotBaseline.captureAndCompare(
                grid,
                "plaque-field-grid-mixed",
                VIEWPORT_WIDTH,
                "plaque-field-grid-mixed-" + VIEWPORT_WIDTH);
    }
}
