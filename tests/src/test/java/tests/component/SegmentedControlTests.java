package tests.component;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.TestBase;

import java.util.List;

import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.executeJavaScript;
import static com.codeborne.selenide.Selenide.open;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Layer("component")
@Tag("component")
@Epic("Component Catalog")
@Feature("Segmented control")
@DisplayName("Segmented control")
class SegmentedControlTests extends TestBase {

    private static final double SIZE_TOLERANCE_PX = 0.6;

    @BeforeEach
    void openCatalog() {
        open("/components.html#section-segmented-control");
        $("[data-testid='section-segmented-control']").shouldBe(visible);
    }

    @Test
    @DisplayName("Segmented control buttons have 36px min-height")
    void segmentedButtonsHaveThirtySixPixelMinHeight() {
        assertMinHeight("[data-testid='segmented-control-on']", 36);
        assertMinHeight("[data-testid='segmented-control-off']", 36);
    }

    @Test
    @DisplayName("Active segmented button has active class")
    void activeSegmentHasActiveClass() {
        assertTrue(hasClass("[data-testid='segmented-control-on']", "segmented-control__btn--active"));
        assertTrue(!hasClass("[data-testid='segmented-control-off']", "segmented-control__btn--active"));
    }

    private static void assertMinHeight(String selector, double expected) {
        var minHeight = executeJavaScript(
                "return parseFloat(getComputedStyle(document.querySelector(arguments[0])).minHeight);",
                selector);
        assertEquals(expected, ((Number) minHeight).doubleValue(), SIZE_TOLERANCE_PX, selector + " min-height");
        assertTrue(readHeight(selector) >= expected - SIZE_TOLERANCE_PX, selector + " rendered height");
    }

    private static boolean hasClass(String selector, String className) {
        return Boolean.TRUE.equals(executeJavaScript(
                "return document.querySelector(arguments[0]).classList.contains(arguments[1]);",
                selector,
                className));
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
