package config;

/**
 * Smoke-stack config — mirrors tests-python {@code config.py} / Selenide env profile keys.
 * Defaults target prod like the Python sibling so smoke runs without local compose.
 */
public record TestConfig(
        String baseUrl,
        String apiBaseUrl,
        String browserVersion,
        String browserSize,
        boolean headless,
        String remoteUrl,
        boolean enableVnc,
        boolean enableVideo
) {
    public static TestConfig load() {
        String base = propOrEnv("baseUrl", "BASE_URL", "https://reference-app.autotests.ai/");
        String api = propOrEnv("apiBaseUrl", "API_BASE_URL", base);
        return new TestConfig(
                withSlash(base),
                withSlash(api),
                propOrEnv("browserVersion", "BROWSER_VERSION", "148.0"),
                propOrEnv("browserSize", "BROWSER_SIZE", "1740x1080"),
                bool("headless", "HEADLESS", true),
                propOrEnv("remoteUrl", "REMOTE_URL", "").trim(),
                bool("enableVnc", "ENABLE_VNC", false),
                bool("enableVideo", "ENABLE_VIDEO", false)
        );
    }

    public String webBaseUrl() {
        return baseUrl.replaceAll("/+$", "");
    }

    private static String propOrEnv(String prop, String env, String defaultValue) {
        String fromProp = System.getProperty(prop);
        if (fromProp != null && !fromProp.isBlank()) {
            return fromProp.trim();
        }
        String fromEnv = System.getenv(env);
        if (fromEnv != null && !fromEnv.isBlank()) {
            return fromEnv.trim();
        }
        return defaultValue;
    }

    private static boolean bool(String prop, String env, boolean defaultValue) {
        String fromProp = System.getProperty(prop);
        String raw = (fromProp != null && !fromProp.isBlank())
                ? fromProp
                : System.getenv(env);
        if (raw == null || raw.isBlank()) {
            return defaultValue;
        }
        return switch (raw.trim().toLowerCase()) {
            case "1", "true", "yes", "on" -> true;
            case "0", "false", "no", "off" -> false;
            default -> defaultValue;
        };
    }

    private static String withSlash(String url) {
        String trimmed = url.trim();
        return trimmed.endsWith("/") ? trimmed : trimmed + "/";
    }
}
