package pages;

import config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.net.URI;
import java.time.Duration;
import java.util.function.Function;

/**
 * Shared waits / React-controlled input fill — mirrors tests-python {@code pages.base.BasePage}.
 */
public abstract class BasePage {

    protected final WebDriver driver;
    protected final TestConfig config;
    protected final Duration timeout;

    protected BasePage(WebDriver driver, TestConfig config) {
        this(driver, config, Duration.ofSeconds(10));
    }

    protected BasePage(WebDriver driver, TestConfig config, Duration timeout) {
        this.driver = driver;
        this.config = config;
        this.timeout = timeout;
    }

    protected WebDriverWait driverWait() {
        return new WebDriverWait(driver, timeout);
    }

    protected void openPath(String path) {
        String base = config.webBaseUrl();
        String suffix = path.startsWith("/") ? path : "/" + path;
        driver.get(base + suffix);
    }

    protected WebElement waitVisible(By locator) {
        return driverWait().until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected WebElement waitTextContains(By locator, String fragment) {
        driverWait().until(d -> {
            var els = d.findElements(locator);
            if (els.isEmpty()) {
                return false;
            }
            String text = els.getFirst().getText();
            return text != null && text.contains(fragment);
        });
        return driver.findElement(locator);
    }

    /**
     * Reliable input fill for React controlled fields (≈ Selenide setValue).
     */
    protected void fill(By locator, String text) {
        WebElement el = waitVisible(locator);
        ((JavascriptExecutor) driver).executeScript(
                """
                const el = arguments[0];
                const value = arguments[1];
                const setter = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype, 'value'
                ).set;
                setter.call(el, value);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                """,
                el,
                text
        );
    }

    protected void jsClick(By locator) {
        WebElement el = waitVisible(locator);
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
    }

    protected void waitUrlIsHome() {
        URI expected = URI.create(config.baseUrl());
        driverWait().until((Function<WebDriver, Boolean>) d -> {
            URI current = URI.create(d.getCurrentUrl());
            String path = current.getPath() == null ? "" : current.getPath();
            return expected.getHost().equals(current.getHost())
                    && (path.isEmpty() || path.equals("/"));
        });
    }

    protected void waitUrlPathEndsWith(String suffix) {
        driverWait().until((Function<WebDriver, Boolean>) d -> {
            String path = URI.create(d.getCurrentUrl()).getPath();
            if (path == null) {
                return false;
            }
            String normalized = path.endsWith("/") && path.length() > 1
                    ? path.substring(0, path.length() - 1)
                    : path;
            return normalized.endsWith(suffix);
        });
    }
}
