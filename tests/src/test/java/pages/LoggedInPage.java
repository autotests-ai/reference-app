package pages;

import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.executeJavaScript;
import static com.codeborne.selenide.Selenide.open;
import static io.restassured.RestAssured.given;

import com.codeborne.selenide.SelenideElement;
import config.ConfigReader;
import io.qameta.allure.Step;
import io.restassured.http.ContentType;

import java.time.Duration;

public class LoggedInPage {

    private final SelenideElement welcomeMessage = $("[data-testid='welcome-message']");
    private final SelenideElement logoutButton = $("[data-testid='logout-button']");
    private final SelenideElement formTitle = $("[data-testid='logged-in-title']");
    private final SelenideElement successPanel = $("[data-testid='success-panel']");

    @Step("Open logged in page with local storage authentication")
    public LoggedInPage openPageWithLocalStorageAuthentication(String username, String password) {
        String token = given()
                .contentType(ContentType.JSON)
                .body("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}")
                .when()
                .post(ConfigReader.resolveApiBaseUrl() + "/api/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("token");

        open("login.html");
        executeJavaScript(
                "localStorage.setItem(arguments[0], arguments[1]);",
                "authToken",
                token
        );
        open("logged-in.html");
        return this;
    }

    @Step("Verify form title message: {message}")
    public LoggedInPage shouldHaveFormTitle(String message) {
        formTitle.shouldHave(text(message));
        return this;
    }

    @Step("Verify welcome message: {message}")
    public LoggedInPage shouldHaveWelcomeMessage(String message) {
        welcomeMessage.shouldBe(visible, Duration.ofSeconds(10));
        welcomeMessage.shouldHave(text(message));
        return this;
    }

    @Step("Click logout button")
    public LoginPage clickLogoutButton() {
        logoutButton.click();
        return new LoginPage();
    }
}
