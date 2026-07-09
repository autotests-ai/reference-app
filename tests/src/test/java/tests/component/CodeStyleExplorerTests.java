package tests.component;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.TestBase;

import static com.codeborne.selenide.Condition.attribute;
import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.open;

@Layer("component")
@Tag("component")
@Epic("Component Catalog")
@Feature("Code style explorer")
@DisplayName("Code style explorer")
class CodeStyleExplorerTests extends TestBase {

    @BeforeEach
    void openExplorer() {
        open("/code-style-explorer.html");
        $("[data-testid='code-style-explorer']").shouldBe(visible);
    }

    @Test
    @DisplayName("Catalog renders default canon-smoke sample in terminal")
    void defaultTopicRendersInTerminal() {
        $("[data-testid='cse-catalog']").shouldBe(visible);
        $("[data-testid='cse-terminal']").shouldBe(visible);
        $("[data-testid='cse-topic-canon-smoke']").shouldHave(attribute("aria-pressed", "true"));
        $("[data-testid='cse-output']").shouldHave(text("@Test"));
        $("[data-testid='cse-output']").shouldHave(text("fillAndSubmitForm"));
        $("[data-testid='cse-builder-link']").shouldBe(visible);
    }

    @Test
    @DisplayName("Selecting another topic updates terminal output")
    void topicSwitchUpdatesTerminal() {
        $("[data-testid='cse-topic-negative-raw']").click();
        $("[data-testid='cse-topic-negative-raw']").shouldHave(attribute("aria-pressed", "true"));
        $("[data-testid='cse-topic-canon-smoke']").shouldHave(attribute("aria-pressed", "false"));
        $("[data-testid='cse-output']").shouldHave(text("wrongPasswordAuthorizationTest"));
        $("[data-testid='cse-output']").shouldNotHave(text("fillAndSubmitForm"));
    }
}
