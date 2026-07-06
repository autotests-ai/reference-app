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

public class HomePage {

    private final SelenideElement layout = $("[data-testid='reference-layout']");
    private final SelenideElement healthStatus = $("[data-testid='health-status']");
    private final SelenideElement itemsList = $("[data-testid='items-list']");
    private final SelenideElement welcomeMessage = $("[data-testid='welcome-message']");
    private final SelenideElement logoutButton = $("[data-testid='logout-button']");
    private final SelenideElement sessionPanel = $("[data-testid='session-panel']");

    @Step("Open home page")
    public HomePage openPage() {
        open("/");
        return this;
    }

    @Step("Open home page with local storage authentication")
    public HomePage openPageWithLocalStorageAuthentication(String username, String password) {
        String token = given()
                .contentType(ContentType.JSON)
                .body("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}")
                .when()
                .post(apiPath("/api/auth/login"))
                .then()
                .statusCode(200)
                .extract()
                .path("token");

        open("/login");
        executeJavaScript(
                "localStorage.setItem(arguments[0], arguments[1]);",
                "authToken",
                token
        );
        open("/");
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

    @Step("Verify welcome message: {message}")
    public HomePage shouldHaveWelcomeMessage(String message) {
        sessionPanel.shouldBe(visible, Duration.ofSeconds(10));
        welcomeMessage.shouldHave(text(message));
        return this;
    }

    @Step("Click logout button")
    public LoginPage clickLogoutButton() {
        logoutButton.click();
        return new LoginPage();
    }

    private static String apiPath(String path) {
        var base = ConfigReader.resolveApiBaseUrl();
        var suffix = path.startsWith("/") ? path.substring(1) : path;
        return base + suffix;
    }
}
