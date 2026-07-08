package helpers;

import com.codeborne.selenide.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.Locale;
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

    private static String puppeteerPlatform() {
        var os = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
        var arch = System.getProperty("os.arch", "").toLowerCase(Locale.ROOT);
        if (os.contains("mac")) {
            return arch.contains("aarch64") || arch.contains("arm") ? "mac_arm" : "mac";
        }
        if (os.contains("linux")) {
            return "linux";
        }
        throw new IllegalStateException("Unsupported OS for LocalChromePin: " + os);
    }

    private static String seleniumCacheArch() {
        return switch (puppeteerPlatform()) {
            case "mac_arm" -> "mac-arm64";
            case "mac" -> "mac-x64";
            case "linux" -> "linux64";
            default -> throw new IllegalStateException("Unsupported platform: " + puppeteerPlatform());
        };
    }

    private static IllegalStateException missingBrowser(String browserVersion) {
        return new IllegalStateException("""
                Chrome %s browser binary not found locally.
                Install Chrome for Testing (not system Chrome):
                  npx @puppeteer/browsers install chrome@148.0.7778.178 --platform %s --path ~/.local/share/chrome-for-testing
                """.formatted(browserVersion, puppeteerPlatform()).trim());
    }

    private static IllegalStateException missingDriver(String browserVersion) {
        return new IllegalStateException("""
                chromedriver for Chrome %s not found locally.
                Install:
                  npx @puppeteer/browsers install chromedriver@148.0.7778.178 --platform %s --path ~/.local/share/chrome-for-testing
                """.formatted(browserVersion, puppeteerPlatform()).trim());
    }

    private static java.util.Optional<Path> findChromeBinary(String major) {
        var chromeRoot = CHROME_FOR_TESTING.resolve("chrome");
        if (!Files.isDirectory(chromeRoot)) {
            return java.util.Optional.empty();
        }
        var platform = puppeteerPlatform();
        try (Stream<Path> dirs = Files.list(chromeRoot)) {
            return dirs
                    .filter(Files::isDirectory)
                    .filter(dir -> dir.getFileName().toString().startsWith(platform + "-" + major + "."))
                    .max(Comparator.comparing(path -> path.getFileName().toString()))
                    .map(LocalChromePin::resolveChromeBinary)
                    .filter(Files::isExecutable);
        } catch (IOException e) {
            return java.util.Optional.empty();
        }
    }

    private static Path resolveChromeBinary(Path versionDir) {
        return switch (puppeteerPlatform()) {
            case "mac_arm" -> versionDir.resolve(
                    "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
            case "mac" -> versionDir.resolve(
                    "chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
            case "linux" -> versionDir.resolve("chrome-linux64/chrome");
            default -> throw new IllegalStateException("Unsupported platform: " + puppeteerPlatform());
        };
    }

    private static java.util.Optional<Path> findChromeDriver(String major) {
        var driverRoot = CHROME_FOR_TESTING.resolve("chromedriver");
        if (Files.isDirectory(driverRoot)) {
            try (Stream<Path> dirs = Files.list(driverRoot)) {
                var platform = puppeteerPlatform();
                var fromCft = dirs
                        .filter(Files::isDirectory)
                        .filter(dir -> dir.getFileName().toString().startsWith(platform + "-" + major + "."))
                        .max(Comparator.comparing(path -> path.getFileName().toString()))
                        .map(LocalChromePin::resolveChromeDriver)
                        .filter(Files::isExecutable);
                if (fromCft.isPresent()) {
                    return fromCft;
                }
            } catch (IOException ignored) {
                // fall through to selenium cache
            }
        }

        var seleniumCache = Path.of(
                System.getProperty("user.home"),
                ".cache/selenium/chromedriver",
                seleniumCacheArch());
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

    private static Path resolveChromeDriver(Path versionDir) {
        return switch (puppeteerPlatform()) {
            case "mac_arm" -> versionDir.resolve("chromedriver-mac-arm64/chromedriver");
            case "mac" -> versionDir.resolve("chromedriver-mac-x64/chromedriver");
            case "linux" -> versionDir.resolve("chromedriver-linux64/chromedriver");
            default -> throw new IllegalStateException("Unsupported platform: " + puppeteerPlatform());
        };
    }
}
