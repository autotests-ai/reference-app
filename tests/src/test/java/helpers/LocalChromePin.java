package helpers;

import com.codeborne.selenide.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.stream.Stream;

/**
 * Pins local Chrome to browserVersion (default 148) via Chrome for Testing.
 * Bypasses Selenium Manager so system Chrome 150 is never used silently.
 */
public final class LocalChromePin {

    private static final Path CHROME_FOR_TESTING =
            Path.of(System.getProperty("user.home"), ".local/share/chrome-for-testing");

    private LocalChromePin() {
    }

    public static void apply(String browserVersion) {
        if (browserVersion == null || browserVersion.isBlank()) {
            throw new IllegalStateException(
                    "browserVersion is required for local Chrome (canon: 148). "
                            + "Do not run e2e on system Chrome without explicit override.");
        }
        var major = browserVersion.split("\\.")[0];
        var chromeBinary = findChromeBinary(major)
                .orElseThrow(() -> missingBrowser(browserVersion));
        var chromeDriver = findChromeDriver(major)
                .orElseThrow(() -> missingDriver(browserVersion));

        Configuration.browserBinary = chromeBinary.toString();
        System.setProperty("webdriver.chrome.driver", chromeDriver.toString());
        Configuration.browserVersion = null;
    }

    private static IllegalStateException missingBrowser(String browserVersion) {
        return new IllegalStateException("""
                Chrome %s browser binary not found locally.
                Install Chrome for Testing (not system Chrome):
                  npx @puppeteer/browsers install chrome@148.0.7778.178 --platform mac_arm --path ~/.local/share/chrome-for-testing
                """.formatted(browserVersion).trim());
    }

    private static IllegalStateException missingDriver(String browserVersion) {
        return new IllegalStateException("""
                chromedriver for Chrome %s not found locally.
                Install:
                  npx @puppeteer/browsers install chromedriver@148.0.7778.178 --platform mac_arm --path ~/.local/share/chrome-for-testing
                """.formatted(browserVersion).trim());
    }

    private static java.util.Optional<Path> findChromeBinary(String major) {
        var chromeRoot = CHROME_FOR_TESTING.resolve("chrome");
        if (!Files.isDirectory(chromeRoot)) {
            return java.util.Optional.empty();
        }
        try (Stream<Path> dirs = Files.list(chromeRoot)) {
            return dirs
                    .filter(Files::isDirectory)
                    .filter(dir -> dir.getFileName().toString().startsWith("mac_arm-" + major + "."))
                    .max(Comparator.comparing(path -> path.getFileName().toString()))
                    .map(dir -> dir.resolve("chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"))
                    .filter(Files::isExecutable);
        } catch (IOException e) {
            return java.util.Optional.empty();
        }
    }

    private static java.util.Optional<Path> findChromeDriver(String major) {
        var driverRoot = CHROME_FOR_TESTING.resolve("chromedriver");
        if (Files.isDirectory(driverRoot)) {
            try (Stream<Path> dirs = Files.list(driverRoot)) {
                var fromCft = dirs
                        .filter(Files::isDirectory)
                        .filter(dir -> dir.getFileName().toString().startsWith("mac_arm-" + major + "."))
                        .max(Comparator.comparing(path -> path.getFileName().toString()))
                        .map(dir -> dir.resolve("chromedriver-mac-arm64/chromedriver"))
                        .filter(Files::isExecutable);
                if (fromCft.isPresent()) {
                    return fromCft;
                }
            } catch (IOException ignored) {
                // fall through to selenium cache
            }
        }

        var seleniumCache = Path.of(System.getProperty("user.home"), ".cache/selenium/chromedriver/mac-arm64");
        if (!Files.isDirectory(seleniumCache)) {
            return java.util.Optional.empty();
        }
        try (Stream<Path> dirs = Files.list(seleniumCache)) {
            return dirs
                    .filter(Files::isDirectory)
                    .filter(dir -> dir.getFileName().toString().startsWith(major + "."))
                    .max(Comparator.comparing(path -> path.getFileName().toString()))
                    .map(dir -> dir.resolve("chromedriver"))
                    .filter(Files::isExecutable);
        } catch (IOException e) {
            return java.util.Optional.empty();
        }
    }
}
