package helpers;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.openqa.selenium.json.Json;

/**
 * Server-rendered HAR viewer HTML for Allure attachments.
 * <p>
 * Expandable rows use {@code <details>} (no JS). Tabs Headers / Timings / Response use
 * radio + {@code :has()} so they work when Allure CSP blocks scripts. Raw HAR is a
 * separate Allure attachment ({@code capture.har}).
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

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> root = JSON.toType(new String(harJson, StandardCharsets.UTF_8), Map.class);
            Object logObj = root.get("log");
            if (!(logObj instanceof Map<?, ?> logRaw)) {
                return fillTemplate("Invalid HAR", "<div class=\"error\">Missing log section</div>");
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> log = (Map<String, Object>) logRaw;
            return fillTemplate(buildSummary(log), buildContent(log));
        } catch (RuntimeException ex) {
            return fillTemplate("Parse error",
                    "<div class=\"error\">Failed to render HAR: " + escapeHtml(ex.getMessage()) + "</div>");
        }
    }

    private static String fillTemplate(String summary, String content) {
        return TEMPLATE
                .replace("__SUMMARY__", escapeHtml(summary))
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
        double totalMs = 0;

        for (Map<String, Object> entry : entries) {
            long start = parseInstant(entry.get("startedDateTime"));
            double time = doubleVal(entry.get("time"));
            if (start >= 0) {
                starts.add(start);
                ends.add(start + (long) Math.max(time, 0));
            }
            totalMs += Math.max(time, 0);
        }

        long t0 = starts.stream().min(Long::compare).orElse(0L);
        long t1 = ends.stream().max(Long::compare).orElse(t0);
        double span = Math.max(Math.max((double) (t1 - t0), totalMs), 1.0);

        StringBuilder rows = new StringBuilder();
        for (int i = 0; i < entries.size(); i++) {
            rows.append(buildEntry(entries.get(i), i, t0, span));
        }

        return """
                <div class="entries">
                <div class="cols-head" aria-hidden="true">
                  <span></span><span>Method</span><span>URL</span><span>Status</span><span>Size</span><span>Time</span><span>Waterfall</span>
                </div>
                %s
                </div>
                """.formatted(rows);
    }

    @SuppressWarnings("unchecked")
    private static String buildEntry(Map<String, Object> entry, int index, long t0, double span) {
        Map<String, Object> req = mapVal(entry.get("request"));
        Map<String, Object> res = mapVal(entry.get("response"));
        Map<String, Object> timings = mapVal(entry.get("timings"));
        Map<String, Object> content = mapVal(res.get("content"));

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
        double receive = Math.max(doubleVal(timings.get("receive")), 0);
        double recvPct = time > 0 ? Math.min((receive / time) * 100.0, 100.0) : 20.0;

        String idH = "e" + index + "-h";
        String idT = "e" + index + "-t";
        String idR = "e" + index + "-r";

        return """
                <details class="entry">
                  <summary>
                    <span class="twist" aria-hidden="true"></span>
                    <span class="cell method %s">%s</span>
                    <span class="cell url" title="%s">%s</span>
                    <span class="cell status %s">%d %s</span>
                    <span class="cell">%s</span>
                    <span class="cell">%.0f ms</span>
                    <span class="cell"><div class="waterfall">
                      <span class="bar wait" style="left:%.2f%%;width:%.2f%%"></span>
                      <span class="bar receive" style="left:%.2f%%;width:%.2f%%"></span>
                    </div></span>
                  </summary>
                  <div class="detail">
                    <div class="tabs">
                      <div class="tab-bar">
                        <input class="tab-headers" type="radio" name="e%d" id="%s" checked>
                        <label for="%s">Headers</label>
                        <input class="tab-timings" type="radio" name="e%d" id="%s">
                        <label for="%s">Timings</label>
                        <input class="tab-response" type="radio" name="e%d" id="%s">
                        <label for="%s">Response</label>
                      </div>
                      <div class="tab-panel panel-headers">
                        <div class="section-title">Response Headers</div>
                        %s
                        <div class="section-title">Request Headers</div>
                        %s
                      </div>
                      <div class="tab-panel panel-timings">
                        %s
                      </div>
                      <div class="tab-panel panel-response">
                        %s
                      </div>
                    </div>
                  </div>
                </details>
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
                width * recvPct / 100.0,
                index, idH, idH,
                index, idT, idT,
                index, idR, idR,
                buildHeaderKv(res.get("headers")),
                buildHeaderKv(req.get("headers")),
                buildTimingsPanel(timings, time),
                buildResponsePanel(content, size, status, statusText));
    }

    private static String buildHeaderKv(Object headersObj) {
        List<Map<String, String>> headers = headerMaps(headersObj);
        if (headers.isEmpty()) {
            return "<div class=\"muted\">No headers captured.</div>";
        }
        StringBuilder sb = new StringBuilder("<div class=\"kv\">");
        for (Map<String, String> h : headers) {
            sb.append("<div class=\"k\">").append(escapeHtml(stringVal(h.get("name")))).append("</div>");
            sb.append("<div class=\"v\">").append(escapeHtml(stringVal(h.get("value")))).append("</div>");
        }
        sb.append("</div>");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, String>> headerMaps(Object headersObj) {
        List<Map<String, String>> out = new ArrayList<>();
        if (!(headersObj instanceof List<?> list)) {
            return out;
        }
        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                out.add((Map<String, String>) map);
            }
        }
        return out;
    }

    private static String buildTimingsPanel(Map<String, Object> timings, double totalMs) {
        StringBuilder sb = new StringBuilder("<div class=\"kv\">");
        appendTiming(sb, "blocked", timings.get("blocked"));
        appendTiming(sb, "dns", timings.get("dns"));
        appendTiming(sb, "connect", timings.get("connect"));
        appendTiming(sb, "ssl", timings.get("ssl"));
        appendTiming(sb, "send", timings.get("send"));
        appendTiming(sb, "wait", timings.get("wait"));
        appendTiming(sb, "receive", timings.get("receive"));
        sb.append("<div class=\"k\">total</div><div class=\"v\">")
                .append(String.format(Locale.ROOT, "%.0f ms", totalMs))
                .append("</div></div>");
        return sb.toString();
    }

    private static void appendTiming(StringBuilder sb, String name, Object value) {
        double ms = doubleVal(value);
        String text = ms < 0 ? "—" : String.format(Locale.ROOT, "%.0f ms", ms);
        sb.append("<div class=\"k\">").append(name).append("</div>");
        sb.append("<div class=\"v\">").append(text).append("</div>");
    }

    private static String buildResponsePanel(Map<String, Object> content, long size, int status, String statusText) {
        String mime = stringVal(content.get("mimeType"));
        if (mime.isEmpty()) {
            mime = "—";
        }
        String bodyNote = "Body not captured (headers + size only).";
        Object text = content.get("text");
        if (text instanceof String body && !body.isEmpty()) {
            bodyNote = body;
        }
        return """
                <div class="kv">
                  <div class="k">status</div><div class="v">%d %s</div>
                  <div class="k">mimeType</div><div class="v">%s</div>
                  <div class="k">size</div><div class="v">%s</div>
                </div>
                <div class="section-title">Body</div>
                <div class="muted" style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere">%s</div>
                """.formatted(
                status,
                escapeHtml(statusText),
                escapeHtml(mime),
                escapeHtml(formatBytes(size)),
                escapeHtml(bodyNote));
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
