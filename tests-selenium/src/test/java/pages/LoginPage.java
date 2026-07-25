package pages;

import config.TestConfig;
import io.qameta.allure.Step;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class LoginPage extends BasePage {

    private static final By LOGIN_INPUT = By.cssSelector("[data-testid='login-input']");
    private static final By PASSWORD_INPUT = By.cssSelector("[data-testid='password-input']");
    private static final By SUBMIT = By.cssSelector("[data-testid='submit-button']");
    private static final By FORM_TITLE = By.cssSelector("[data-testid='login-form-title']");
    private static final By ERROR = By.cssSelector("[data-testid='error-message']");
    private static final By REGISTER_LINK = By.cssSelector("[data-testid='register-link']");
    private static final By HEADER = By.cssSelector("[data-testid='header']");

    public LoginPage(WebDriver driver, TestConfig config) {
        super(driver, config);
    }

    @Step("Open login page")
    public LoginPage openPage() {
        openPath("/login");
        return this;
    }

    @Step("Click 'Register' link under the login form")
    public RegisterPage clickRegisterLink() {
        driver.findElement(REGISTER_LINK).click();
        return new RegisterPage(driver, config);
    }

    @Step("Fill and submit form")
    public HomePage fillAndSubmitForm(String username, String password) {
        typeUsername(username);
        typePassword(password);
        return submit();
    }

    @Step("Type username: {username}")
    public LoginPage typeUsername(String username) {
        fill(LOGIN_INPUT, username);
        return this;
    }

    @Step("Type password")
    public LoginPage typePassword(String password) {
        fill(PASSWORD_INPUT, password);
        return this;
    }

    @Step("Submit login form")
    public HomePage submit() {
        driver.findElement(SUBMIT).click();
        waitUrlIsHome();
        return new HomePage(driver, config);
    }

    @Step("Submit login form expecting validation error")
    public LoginPage submitExpectingError() {
        driver.findElement(SUBMIT).click();
        waitVisible(ERROR);
        return this;
    }

    @Step("Verify embedded header is mounted")
    public LoginPage shouldShowEmbeddedHeader() {
        waitVisible(HEADER);
        return this;
    }

    @Step("Verify login form is mounted")
    public LoginPage shouldShowLoginForm() {
        waitVisible(FORM_TITLE);
        waitVisible(LOGIN_INPUT);
        waitVisible(PASSWORD_INPUT);
        waitVisible(SUBMIT);
        return this;
    }

    @Step("Verify form title message: {message}")
    public LoginPage shouldHaveFormTitle(String message) {
        waitTextContains(FORM_TITLE, message);
        return this;
    }

    @Step("Verify error message: {message}")
    public LoginPage shouldHaveErrorMessage(String message) {
        waitTextContains(ERROR, message);
        return this;
    }
}
