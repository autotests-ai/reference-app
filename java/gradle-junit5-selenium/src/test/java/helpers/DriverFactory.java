package helpers;

import config.TestConfig;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.RemoteWebDriver;

import java.net.URI;
import java.util.HashMap;

/**
 * Local Chrome for Testing (pinned) or remote Selenoid — mirrors tests-python conftest.
 */
public final class DriverFactory {

    private DriverFactory() {
    }

    public static WebDriver create(TestConfig config) {
        ChromeOptions options = new ChromeOptions();
        String[] size = config.browserSize().toLowerCase().split("x");
        if (size.length == 2) {
            options.addArguments("--window-size=" + size[0].trim() + "," + size[1].trim());
        }
        options.addArguments("--no-sandbox", "--disable-dev-shm-usage");

        if (!config.remoteUrl().isBlank()) {
            var selenoidOpts = new HashMap<String, Object>();
            selenoidOpts.put("enableVNC", config.enableVnc());
            selenoidOpts.put("enableVideo", config.enableVideo());
            selenoidOpts.put("headless", config.headless());
            selenoidOpts.put("name", "reference-app-java-gradle-junit5-selenium");
            options.setCapability("browserVersion", config.browserVersion());
            options.setCapability("selenoid:options", selenoidOpts);
            try {
                return new RemoteWebDriver(URI.create(config.remoteUrl()).toURL(), options);
            } catch (Exception e) {
                throw new IllegalStateException("Failed to create remote WebDriver: " + config.remoteUrl(), e);
            }
        }

        if (config.headless()) {
            options.addArguments("--headless=new", "--disable-gpu");
        }
        LocalChromePin.Paths pin = LocalChromePin.resolve(config.browserVersion());
        options.setBinary(pin.chromeBinary().toString());
        System.setProperty("webdriver.chrome.driver", pin.chromeDriver().toString());
        ChromeDriver driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(java.time.Duration.ZERO);
        return driver;
    }
}
