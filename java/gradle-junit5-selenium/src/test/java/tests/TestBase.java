package tests;

import config.TestConfig;
import helpers.DriverFactory;
import io.qameta.allure.Allure;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import pages.HeaderComponent;
import pages.HomePage;
import pages.LoginPage;
import pages.RegisterPage;

public abstract class TestBase {

    protected static final TestConfig config = TestConfig.load();

    protected WebDriver driver;
    protected LoginPage loginPage;
    protected RegisterPage registerPage;
    protected HomePage homePage;
    protected HeaderComponent header;

    @BeforeEach
    void setUp() {
        Allure.label("layer", "e2e");
        Allure.label("framework", "selenium");
        driver = DriverFactory.create(config);
        loginPage = new LoginPage(driver, config);
        registerPage = new RegisterPage(driver, config);
        homePage = new HomePage(driver, config);
        header = new HeaderComponent(driver, config);
    }

    @AfterEach
    void tearDown() {
        if (driver == null) {
            return;
        }
        try {
            if (driver instanceof TakesScreenshot screenshot) {
                byte[] png = screenshot.getScreenshotAs(OutputType.BYTES);
                Allure.getLifecycle().addAttachment("final-screenshot", "image/png", "png", png);
            }
        } catch (Exception ignored) {
            // best-effort attachment
        }
        driver.quit();
        driver = null;
    }
}
