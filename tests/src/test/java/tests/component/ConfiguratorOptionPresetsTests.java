package tests.component;

import annotations.Layer;
import helpers.ViewportHelper;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.TestBase;

import java.util.List;
import java.util.Map;

import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.executeJavaScript;
import static com.codeborne.selenide.Selenide.open;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Layer("component")
@Tag("component")
@Epic("Component Catalog")
@Feature("Configurator option presets")
@DisplayName("Configurator option presets")
class ConfiguratorOptionPresetsTests extends TestBase {

    private static final double SIZE_TOLERANCE_PX = 0.6;
    private static final double LAYOUT_TOLERANCE_PX = 0.5;

    @BeforeEach
    void openPresets() {
        ViewportHelper.setViewport(1280, 900);
        open("/configurator-option-presets.html");
        $("[data-testid='configurator-option-presets']").shouldBe(visible);
    }

    @Test
    @DisplayName("Build group and OS row are visible")
    void buildGroupIsVisible() {
        $("[data-testid='copp-group-build']").shouldBe(visible);
        $("[data-testid='copp-build-os-lang-row']").shouldBe(visible);
        $("[data-testid='copp-param-buildOs']").shouldBe(visible);
        $("[data-testid='copp-seg-buildTool']").shouldBe(visible);
    }

    @Test
    @DisplayName("Build tool seg track is 24px and buttons are 20px")
    void buildToolSegMatchesComponentSizes() {
        assertElementHeight("[data-testid='copp-seg-buildTool'] .plaque-field-seg-track", 24);
        assertElementHeight("[data-testid='copp-seg-buildTool'] .plaque-field-seg__btn", 20);
    }

    @Test
    @DisplayName("OS and buildTool dividers share axis inside build stack")
    void buildStackDividersAreAligned() {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> issues = executeJavaScript(
                """
                const osDivider = document.querySelector('[data-testid="copp-param-buildOs"] .plaque-divider');
                const buildToolDivider = document.querySelector('[data-testid="copp-seg-buildTool"] .plaque-divider');
                const tolerance = arguments[0];
                const problems = [];
                if (!osDivider || !buildToolDivider) {
                  problems.push({ kind: 'missing-dividers' });
                  return problems;
                }
                const delta = Math.abs(
                  osDivider.getBoundingClientRect().left - buildToolDivider.getBoundingClientRect().left
                );
                if (delta > tolerance) {
                  problems.push({ kind: 'divider-axis', delta: delta });
                }
                return problems;
                """,
                LAYOUT_TOLERANCE_PX);

        assertTrue(issues.isEmpty(), "build stack divider alignment issues: " + issues);
    }

    private static void assertElementHeight(String selector, double expected) {
        assertEquals(expected, readHeight(selector), SIZE_TOLERANCE_PX, selector + " height");
    }

    private static double readHeight(String selector) {
        return readSize(selector)[1];
    }

    private static double[] readSize(String selector) {
        @SuppressWarnings("unchecked")
        List<Number> result = executeJavaScript(
                """
                const el = document.querySelector(arguments[0]);
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                return [rect.width, rect.height];
                """,
                selector);
        return new double[] {result.get(0).doubleValue(), result.get(1).doubleValue()};
    }
}
