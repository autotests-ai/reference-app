package pages;

import config.TestConfig;
import io.qameta.allure.Step;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class RegisterPage extends BasePage {

    private static final By LOGIN_INPUT = By.cssSelector("[data-testid='login-input']");
    private static final By PASSWORD_INPUT = By.cssSelector("[data-testid='password-input']");
    private static final By CONFIRM_PASSWORD = By.cssSelector("[data-testid='confirm-password-input']");
    private static final By SUBMIT = By.cssSelector("[data-testid='submit-button']");
    private static final By FORM_TITLE = By.cssSelector("[data-testid='register-form-title']");
    private static final By ERROR = By.cssSelector("[data-testid='error-message']");
    private static final By LOGIN_LINK = By.cssSelector("[data-testid='login-link']");

    public RegisterPage(WebDriver driver, TestConfig config) {
        super(driver, config);
    }

    @Step("Open register page")
    public RegisterPage openPage() {
        openPath("/register");
        return this;
    }

    @Step("Click 'Login' link under the register form")
    public LoginPage clickLoginLink() {
        driver.findElement(LOGIN_LINK).click();
        return new LoginPage(driver, config);
    }

    @Step("Fill and submit register form")
    public HomePage fillAndSubmitForm(String username, String password, String confirmPassword) {
        typeUsername(username);
        typePassword(password);
        typeConfirmPassword(confirmPassword);
        return submit();
    }

    @Step("Type username: {username}")
    public RegisterPage typeUsername(String username) {
        fill(LOGIN_INPUT, username);
        return this;
    }

    @Step("Type password")
    public RegisterPage typePassword(String password) {
        fill(PASSWORD_INPUT, password);
        return this;
    }

    @Step("Type confirm password")
    public RegisterPage typeConfirmPassword(String confirmPassword) {
        fill(CONFIRM_PASSWORD, confirmPassword);
        return this;
    }

    @Step("Submit register form")
    public HomePage submit() {
        driver.findElement(SUBMIT).click();
        waitUrlIsHome();
        return new HomePage(driver, config);
    }

    @Step("Verify register form is mounted")
    public RegisterPage shouldShowRegisterForm() {
        waitVisible(FORM_TITLE);
        waitVisible(LOGIN_INPUT);
        waitVisible(PASSWORD_INPUT);
        waitVisible(CONFIRM_PASSWORD);
        waitVisible(SUBMIT);
        return this;
    }

    @Step("Verify form title message: {message}")
    public RegisterPage shouldHaveFormTitle(String message) {
        waitTextContains(FORM_TITLE, message);
        return this;
    }

    @Step("Verify error message: {message}")
    public RegisterPage shouldHaveErrorMessage(String message) {
        waitVisible(ERROR);
        waitTextContains(ERROR, message);
        return this;
    }
}
