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
@Feature("Plaque field seg")
@DisplayName("Plaque field seg")
class PlaqueFieldSegTests extends TestBase {

    private static final double SIZE_TOLERANCE_PX = 0.6;
    private static final double LAYOUT_TOLERANCE_PX = 0.5;

    @BeforeEach
    void openCatalog() {
        ViewportHelper.setViewport(1280, 900);
        open("/components.html");
        $("[data-testid='section-plaque-field']").shouldBe(visible);
        $("[data-testid='plaque-field-grid-mixed']").shouldBe(visible);
    }

    @Test
    @DisplayName("Divided seg track is 24px and buttons are 20px")
    void dividedSegTrackMatchesComponentSizes() {
        assertElementHeight("[data-testid='plaque-field-seg'] .plaque-field-seg-track", 24);
        assertElementHeight("[data-testid='plaque-field-seg-true']", 20);
        assertElementHeight("[data-testid='plaque-field-seg-false']", 20);
    }

    @Test
    @DisplayName("Mixed grid seg buttons do not overlap inside track")
    void mixedGridSegButtonsDoNotOverlap() {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> issues = executeJavaScript(
                """
                const grid = document.querySelector('[data-testid="plaque-field-grid-mixed"]');
                const tolerance = arguments[0];
                const problems = [];
                grid.querySelectorAll('.plaque-field--divided').forEach(field => {
                  const label = field.querySelector('.plaque-field__label')?.textContent?.trim() ?? '?';
                  const track = field.querySelector('.plaque-field-seg-track');
                  const seg = field.querySelector('.plaque-field-seg');
                  const btns = [...field.querySelectorAll('.plaque-field-seg__btn')];
                  if (!track || !seg || btns.length !== 2) return;

                  const trackRect = track.getBoundingClientRect();
                  const segRect = seg.getBoundingClientRect();
                  const trackStyle = getComputedStyle(track);
                  const padL = parseFloat(trackStyle.paddingLeft);
                  const padR = parseFloat(trackStyle.paddingRight);
                  const innerLeft = trackRect.left + padL;
                  const innerRight = trackRect.right - padR;
                  const segOverflow = Math.max(0, segRect.right - innerRight, innerLeft - segRect.left);

                  const a = btns[0].getBoundingClientRect();
                  const b = btns[1].getBoundingClientRect();
                  const overlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
                  const gap = b.left - a.right;

                  if (segOverflow > tolerance) {
                    problems.push({ label, kind: 'seg-overflow', value: segOverflow });
                  }
                  if (overlap > tolerance) {
                    problems.push({ label, kind: 'btn-overlap', value: overlap });
                  }
                  if (gap < -tolerance) {
                    problems.push({ label, kind: 'negative-gap', value: gap });
                  }
                });
                return problems;
                """,
                LAYOUT_TOLERANCE_PX);

        assertTrue(issues.isEmpty(), "mixed grid seg layout issues: " + issues);
    }

    @Test
    @DisplayName("Mixed grid tier track heights match component-sizes")
    void mixedGridTierTrackHeights() {
        assertElementHeight(
                "[data-testid='plaque-field-grid-mixed'] .plaque-field-grid__cell--sm .plaque-field-seg-track",
                14);
        assertElementHeight(
                "[data-testid='plaque-field-grid-mixed'] .plaque-field-grid__cell--md .plaque-field-seg-track",
                20);
        assertElementHeight(
                "[data-testid='plaque-field-grid-mixed'] .plaque-field-grid__cell--lg .plaque-field-seg-track",
                24);
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
