package pages;

import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.open;
import static com.codeborne.selenide.Selenide.webdriver;
import static com.codeborne.selenide.WebDriverConditions.url;

import com.codeborne.selenide.SelenideElement;
import config.ConfigReader;
import io.qameta.allure.Step;

import java.time.Duration;

public class RegisterPage {

    private final SelenideElement registerForm = $("[data-testid='register-form']");
    private final SelenideElement loginInput = $("[data-testid='login-input']");
    private final SelenideElement passwordInput = $("[data-testid='password-input']");
    private final SelenideElement confirmPasswordInput = $("[data-testid='confirm-password-input']");
    private final SelenideElement submitButton = $("[data-testid='submit-button']");
    private final SelenideElement formTitle = $("[data-testid='register-form-title']");
    private final SelenideElement errorMessage = $("[data-testid='error-message']");

    @Step("Open register page")
    public RegisterPage openPage() {
        open("/register");
        return this;
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
        loginInput.setValue(username);
        return this;
    }

    @Step("Type password")
    public RegisterPage typePassword(String password) {
        passwordInput.setValue(password);
        return this;
    }

    @Step("Type confirm password")
    public RegisterPage typeConfirmPassword(String confirmPassword) {
        confirmPasswordInput.setValue(confirmPassword);
        return this;
    }

    @Step("Submit register form")
    public HomePage submit() {
        submitButton.click();
        webdriver().shouldHave(url(ConfigReader.resolveBaseUrl()));
        return new HomePage();
    }

    @Step("Verify register form is mounted")
    public RegisterPage shouldShowRegisterForm() {
        formTitle.shouldBe(visible);
        loginInput.shouldBe(visible);
        passwordInput.shouldBe(visible);
        confirmPasswordInput.shouldBe(visible);
        submitButton.shouldBe(visible);
        return this;
    }

    @Step("Verify form title message: {message}")
    public RegisterPage shouldHaveFormTitle(String message) {
        formTitle.shouldHave(text(message));
        return this;
    }

    @Step("Verify error message: {message}")
    public RegisterPage shouldHaveErrorMessage(String message) {
        errorMessage.shouldBe(visible, Duration.ofSeconds(10));
        errorMessage.shouldHave(text(message));
        return this;
    }
}
