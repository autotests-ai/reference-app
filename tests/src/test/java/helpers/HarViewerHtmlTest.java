package helpers;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Tag("unit")
class HarViewerHtmlTest {

    @Test
    void renderEmbedsHarAsBase64AndViewerMarkup() {
        byte[] har = """
                {"log":{"version":"1.2","entries":[{"startedDateTime":"2026-01-01T00:00:00.000Z","time":50,"request":{"method":"GET","url":"https://example.com/"},"response":{"status":200,"statusText":"OK","content":{"size":42}},"timings":{"wait":40,"receive":10}}]}}
                """.trim().getBytes();

        String html = HarViewerHtml.render(har);

        assertTrue(html.contains("HAR Viewer"), () -> "missing title: " + html);
        assertTrue(html.contains("atob(\""), () -> "missing base64 decode: " + html);
        assertTrue(html.contains("Waterfall"), () -> "missing waterfall column: " + html);
        assertFalse(html.contains("__HAR_B64__"), () -> "placeholder not replaced: " + html);
    }
}
