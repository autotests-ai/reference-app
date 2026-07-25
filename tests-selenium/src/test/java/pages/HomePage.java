package pages;

import config.TestConfig;
import io.qameta.allure.Step;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class HomePage extends BasePage {

    private static final By LAYOUT = By.cssSelector("[data-testid='reference-layout']");
    private static final By HEALTH = By.cssSelector("[data-testid='health-status']");
    private static final By ITEMS = By.cssSelector("[data-testid='items-list']");
    private static final By WELCOME = By.cssSelector("[data-testid='welcome-message']");
    private static final By WELCOME_PANEL = By.cssSelector("[data-testid='welcome-panel']");
    private static final By LOGOUT = By.cssSelector("[data-testid='logout-button']");

    public HomePage(WebDriver driver, TestConfig config) {
        super(driver, config);
    }

    @Step("Open home page")
    public HomePage openPage() {
        openPath("/");
        return this;
    }

    @Step("Verify home layout is mounted")
    public HomePage shouldShowLayout() {
        waitVisible(LAYOUT);
        waitVisible(ITEMS);
        return this;
    }

    @Step("Verify health status contains: {textFragment}")
    public HomePage shouldShowHealthText(String textFragment) {
        waitTextContains(HEALTH, textFragment);
        return this;
    }

    @Step("Verify items list contains: {textFragment}")
    public HomePage shouldShowItemText(String textFragment) {
        waitTextContains(ITEMS, textFragment);
        return this;
    }

    @Step("Verify welcome message: {message}")
    public HomePage shouldHaveWelcomeMessage(String message) {
        waitVisible(WELCOME_PANEL);
        waitTextContains(WELCOME, message);
        return this;
    }

    @Step("Click logout button")
    public LoginPage clickLogoutButton() {
        jsClick(LOGOUT);
        waitUrlPathEndsWith("login");
        return new LoginPage(driver, config);
    }
}
