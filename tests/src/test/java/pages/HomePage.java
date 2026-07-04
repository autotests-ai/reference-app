package pages;

import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.open;

import com.codeborne.selenide.SelenideElement;
import io.qameta.allure.Step;

import java.time.Duration;

public class HomePage {

    private final SelenideElement layout = $("[data-testid='reference-layout']");
    private final SelenideElement healthStatus = $("[data-testid='health-status']");
    private final SelenideElement itemsList = $("[data-testid='items-list']");

    @Step("Open home page")
    public HomePage openPage() {
        open("");
        return this;
    }

    @Step("Verify home layout is mounted")
    public HomePage shouldShowLayout() {
        layout.shouldBe(visible, Duration.ofSeconds(10));
        itemsList.shouldBe(visible);
        return this;
    }

    @Step("Verify health status contains: {textFragment}")
    public HomePage shouldShowHealthText(String textFragment) {
        healthStatus.shouldHave(text(textFragment), Duration.ofSeconds(10));
        return this;
    }

    @Step("Verify items list contains: {textFragment}")
    public HomePage shouldShowItemText(String textFragment) {
        itemsList.shouldHave(text(textFragment), Duration.ofSeconds(10));
        return this;
    }
}
