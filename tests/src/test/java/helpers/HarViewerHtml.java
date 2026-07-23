package helpers;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/** Self-contained HTML wrapper for Allure HAR attachments (no external CDN). */
public final class HarViewerHtml {

    private static final String TEMPLATE = loadTemplate();

    private HarViewerHtml() {
    }

    public static String render(byte[] harJson) {
        if (harJson == null || harJson.length == 0) {
            throw new IllegalArgumentException("harJson is empty");
        }
        String b64 = Base64.getEncoder().encodeToString(harJson);
        return TEMPLATE.replace("__HAR_B64__", b64);
    }

    private static String loadTemplate() {
        try (InputStream in = HarViewerHtml.class.getResourceAsStream("/allure/har-viewer-template.html")) {
            if (in == null) {
                throw new IllegalStateException("Missing classpath resource /allure/har-viewer-template.html");
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load HAR viewer template", ex);
        }
    }
}
