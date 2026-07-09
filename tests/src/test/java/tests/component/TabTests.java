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
@Feature("Tab")
@DisplayName("Tab")
class TabTests extends TestBase {

    private static final double SIZE_TOLERANCE_PX = 1.0;

    @BeforeEach
    void openCatalog() {
        open("/components.html#section-tab");
        $("[data-testid='section-tab']").shouldBe(visible);
    }

    @Test
    @DisplayName("Tab height is about 30px")
    void tabHeightIsAboutThirtyPixels() {
        assertElementHeight("[data-testid='tab-gradle']", 30);
        assertElementHeight("[data-testid='tab-json']", 30);
    }

    @Test
    @DisplayName("Active tab has active class")
    void activeTabHasActiveClass() {
        assertTrue(hasClass("[data-testid='tab-gradle']", "tab--active"));
        assertTrue(!hasClass("[data-testid='tab-json']", "tab--active"));
    }

    private static void assertElementHeight(String selector, double expected) {
        assertEquals(expected, readHeight(selector), SIZE_TOLERANCE_PX, selector + " height");
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
