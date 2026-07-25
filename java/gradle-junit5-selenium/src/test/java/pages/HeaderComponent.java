package pages;

import config.TestConfig;
import io.qameta.allure.Step;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class HeaderComponent extends BasePage {

    private static final By ROOT = By.cssSelector("[data-testid='header']");
    private static final By ACTIVE_NAV = By.cssSelector("[data-testid='header-nav'] a[aria-current='page']");

    public HeaderComponent(WebDriver driver, TestConfig config) {
        super(driver, config);
    }

    @Step("Verify header is mounted")
    public HeaderComponent shouldBeMounted() {
        waitVisible(ROOT);
        return this;
    }

    @Step("Verify header nav '{activeTestid}' is the only active item")
    public HeaderComponent shouldHaveActiveNav(String activeTestid) {
        shouldBeMounted();
        By activeLocator = By.cssSelector("[data-testid='" + activeTestid + "']");
        WebElement active = waitVisible(activeLocator);
        driverWait().until(d -> {
            String cls = active.getAttribute("class");
            String aria = active.getAttribute("aria-current");
            boolean hasClass = cls != null && java.util.Arrays.asList(cls.split("\\s+")).contains("is-active");
            return hasClass && "page".equals(aria);
        });
        driverWait().until(d -> d.findElements(ACTIVE_NAV).size() == 1);
        return this;
    }
}
