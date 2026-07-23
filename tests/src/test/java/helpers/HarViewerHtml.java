package helpers;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.openqa.selenium.json.Json;

/**
 * Server-side HAR viewer HTML for Allure attachments.
 * No client JS — Allure iframe CSP blocks inline scripts.
 */
public final class HarViewerHtml {

    private static final Json JSON = new Json();
    private static final String TEMPLATE = loadTemplate();

    private HarViewerHtml() {
    }

    public static String render(byte[] harJson) {
        if (harJson == null || harJson.length == 0) {
            throw new IllegalArgumentException("harJson is empty");
        }
        String b64 = Base64.getEncoder().encodeToString(harJson);
        String downloadHref = "data:application/json;base64," + b64;

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> root = JSON.toType(new String(harJson, StandardCharsets.UTF_8), Map.class);
            Object logObj = root.get("log");
            if (!(logObj instanceof Map<?, ?> logRaw)) {
                return fillTemplate("Invalid HAR", downloadHref, "<div class=\"error\">Missing log section</div>");
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> log = (Map<String, Object>) logRaw;
            return fillTemplate(buildSummary(log), downloadHref, buildContent(log));
        } catch (RuntimeException ex) {
            return fillTemplate("Parse error", downloadHref,
                    "<div class=\"error\">Failed to render HAR: " + escapeHtml(ex.getMessage()) + "</div>");
        }
    }

    private static String fillTemplate(String summary, String downloadHref, String content) {
        return TEMPLATE
                .replace("__SUMMARY__", escapeHtml(summary))
                .replace("__DOWNLOAD_HREF__", downloadHref)
                .replace("__CONTENT__", content);
    }

    @SuppressWarnings("unchecked")
    private static String buildContent(Map<String, Object> log) {
        Object entriesObj = log.get("entries");
        if (!(entriesObj instanceof List<?> entriesRaw) || entriesRaw.isEmpty()) {
            return "<div class=\"empty\">No network entries captured.</div>";
        }

        List<Map<String, Object>> entries = new ArrayList<>();
        for (Object item : entriesRaw) {
            if (item instanceof Map<?, ?> map) {
                entries.add((Map<String, Object>) map);
            }
        }
        if (entries.isEmpty()) {
            return "<div class=\"empty\">No network entries captured.</div>";
        }

        List<Long> starts = new ArrayList<>();
        List<Long> ends = new ArrayList<>();
        long totalBytes = 0;
        double totalMs = 0;

        for (Map<String, Object> entry : entries) {
            long start = parseInstant(entry.get("startedDateTime"));
            double time = doubleVal(entry.get("time"));
            if (start >= 0) {
                starts.add(start);
                ends.add(start + (long) Math.max(time, 0));
            }
            totalMs += Math.max(time, 0);
            totalBytes += responseSize(entry);
        }

        long t0 = starts.stream().min(Long::compare).orElse(0L);
        long t1 = ends.stream().max(Long::compare).orElse(t0);
        double span = Math.max(Math.max(t1 - t0, totalMs), 1.0);

        StringBuilder rows = new StringBuilder();
        for (Map<String, Object> entry : entries) {
            rows.append(buildRow(entry, t0, span));
        }

        return """
                <div class="table-wrap"><table>
                <colgroup><col class="method"><col><col class="status"><col class="size"><col class="time"><col class="waterfall"></colgroup>
                <thead><tr><th>Method</th><th>URL</th><th>Status</th><th>Size</th><th>Time</th><th>Waterfall</th></tr></thead>
                <tbody>%s</tbody>
                </table></div>
                """.formatted(rows);
    }

    @SuppressWarnings("unchecked")
    private static String buildRow(Map<String, Object> entry, long t0, double span) {
        Map<String, Object> req = mapVal(entry.get("request"));
        Map<String, Object> res = mapVal(entry.get("response"));
        Map<String, Object> timings = mapVal(entry.get("timings"));

        String method = stringVal(req.get("method")).toUpperCase(Locale.ROOT);
        if (method.isEmpty()) {
            method = "GET";
        }
        String url = stringVal(req.get("url"));
        int status = intVal(res.get("status"));
        String statusText = stringVal(res.get("statusText"));
        long size = responseSize(entry);
        double time = Math.max(doubleVal(entry.get("time")), 0);
        long start = parseInstant(entry.get("startedDateTime"));
        double left = start >= 0 ? ((start - t0) / span) * 100.0 : 0.0;
        double width = Math.max((time / span) * 100.0, 0.4);
        double wait = Math.max(doubleVal(timings.get("wait")), 0);
        double receive = Math.max(doubleVal(timings.get("receive")), 0);
        double recvPct = time > 0 ? Math.min((receive / time) * 100.0, 100.0) : 20.0;

        return """
                <tr>
                  <td class="method %s">%s</td>
                  <td class="url" title="%s">%s</td>
                  <td class="status %s">%d %s</td>
                  <td>%s</td>
                  <td>%.0f ms</td>
                  <td><div class="waterfall">
                    <span class="bar wait" style="left:%.2f%%;width:%.2f%%"></span>
                    <span class="bar receive" style="left:%.2f%%;width:%.2f%%"></span>
                  </div></td>
                </tr>
                """.formatted(
                escapeHtml(method),
                escapeHtml(method),
                escapeHtml(url),
                escapeHtml(url),
                statusClass(status),
                status,
                escapeHtml(statusText),
                escapeHtml(formatBytes(size)),
                time,
                left,
                width,
                left,
                width * recvPct / 100.0);
    }

    @SuppressWarnings("unchecked")
    private static String buildSummary(Map<String, Object> log) {
        Object entriesObj = log.get("entries");
        if (!(entriesObj instanceof List<?> entries)) {
            return "0 requests";
        }
        long totalBytes = 0;
        double totalMs = 0;
        for (Object item : entries) {
            if (item instanceof Map<?, ?> entryRaw) {
                Map<String, Object> entry = (Map<String, Object>) entryRaw;
                totalMs += Math.max(doubleVal(entry.get("time")), 0);
                totalBytes += responseSize(entry);
            }
        }
        return entries.size() + " requests | " + formatBytes(totalBytes) + " | "
                + String.format(Locale.ROOT, "%.1f", totalMs / 1000.0) + "s";
    }

    @SuppressWarnings("unchecked")
    private static long responseSize(Map<String, Object> entry) {
        Map<String, Object> res = mapVal(entry.get("response"));
        Map<String, Object> content = mapVal(res.get("content"));
        long size = longVal(content.get("size"));
        return Math.max(size, 0);
    }

    private static Map<String, Object> mapVal(Object obj) {
        if (obj instanceof Map<?, ?> map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> cast = (Map<String, Object>) map;
            return cast;
        }
        return Map.of();
    }

    private static String statusClass(int status) {
        if (status >= 200 && status < 300) {
            return "ok";
        }
        if (status >= 300 && status < 400) {
            return "warn";
        }
        if (status >= 400) {
            return "err";
        }
        return "";
    }

    private static String formatBytes(long bytes) {
        if (bytes <= 0) {
            return "—";
        }
        if (bytes < 1024) {
            return bytes + " B";
        }
        if (bytes < 1024 * 1024) {
            return String.format(Locale.ROOT, "%.1f KB", bytes / 1024.0);
        }
        return String.format(Locale.ROOT, "%.1f MB", bytes / (1024.0 * 1024.0));
    }

    private static long parseInstant(Object value) {
        String text = stringVal(value);
        if (text.isEmpty()) {
            return -1;
        }
        try {
            return Instant.parse(text).toEpochMilli();
        } catch (RuntimeException ex) {
            return -1;
        }
    }

    private static String escapeHtml(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private static String stringVal(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private static double doubleVal(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value == null) {
            return 0;
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private static int intVal(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return 0;
    }

    private static long longVal(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return 0;
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
