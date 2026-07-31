"""Server-rendered HAR viewer HTML for Allure — parity with Java HarViewerHtml."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_TEMPLATE = (Path(__file__).resolve().parent / "allure" / "har-viewer-template.html").read_text(
    encoding="utf-8"
)


def _escape(text: Any) -> str:
    if text is None:
        return ""
    s = str(text)
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _num(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _format_bytes(nbytes: float) -> str:
    if nbytes <= 0:
        return "—"
    if nbytes < 1024:
        return f"{int(nbytes)} B"
    if nbytes < 1024 * 1024:
        return f"{nbytes / 1024:.1f} KB"
    return f"{nbytes / (1024 * 1024):.1f} MB"


def _status_color(status: int) -> str:
    if status >= 500:
        return "color:#f48771"
    if status >= 400:
        return "color:#cca700"
    if status >= 300:
        return "color:#6cb6ff"
    if status > 0:
        return "color:#89d185"
    return "color:#999"


def _status_class(status: int) -> str:
    if status >= 500:
        return "har-status--err"
    if status >= 400:
        return "har-status--warn"
    if status >= 300:
        return "har-status--redir"
    if status > 0:
        return "har-status--ok"
    return "har-status--muted"


def _response_size(entry: dict) -> int:
    try:
        return max(int(entry.get("response", {}).get("content", {}).get("size") or 0), 0)
    except (TypeError, ValueError):
        return 0


def _header_kv(headers_obj: Any) -> str:
    headers = headers_obj if isinstance(headers_obj, list) else []
    if not headers:
        return '<div class="har-muted" style="color:#999">No headers captured.</div>'
    parts = [
        '<div class="har-kv" style="display:grid;grid-template-columns:minmax(96px,140px) 1fr;gap:2px 12px;font-size:12px;line-height:1.4">'
    ]
    for h in headers:
        if not isinstance(h, dict):
            continue
        parts.append(
            f'<div class="har-kv__k" style="color:#999;word-break:break-all;white-space:normal">{_escape(h.get("name"))}</div>'
        )
        parts.append(
            f'<div class="har-kv__v" style="color:#ccc;word-break:break-word;overflow-wrap:anywhere;white-space:pre-wrap">{_escape(h.get("value"))}</div>'
        )
    parts.append("</div>")
    return "".join(parts)


def _timings_panel(timings: dict, total_ms: float) -> str:
    parts = [
        '<div class="har-kv" style="display:grid;grid-template-columns:minmax(96px,140px) 1fr;gap:2px 12px;font-size:12px;line-height:1.4">'
    ]
    for name in ("blocked", "dns", "connect", "ssl", "send", "wait", "receive"):
        ms = _num(timings.get(name), -1)
        text = "—" if ms < 0 else f"{ms:.0f} ms"
        parts.append(
            f'<div class="har-kv__k" style="color:#999">{name}</div><div class="har-kv__v" style="color:#ccc">{text}</div>'
        )
    parts.append(
        f'<div class="har-kv__k" style="color:#999">total</div><div class="har-kv__v" style="color:#ccc">{total_ms:.0f} ms</div></div>'
    )
    return "".join(parts)


def _response_panel(content: dict, size: int, status: int, status_text: str) -> str:
    mime = str(content.get("mimeType") or "") or "—"
    body = content.get("text")
    body_note = body if isinstance(body, str) and body else "Body not captured (meta / headers + size only)."
    status_label = "—" if status == 0 else f"{status}{(' ' + status_text) if status_text else ''}"
    return f"""<div class="har-kv" style="display:grid;grid-template-columns:minmax(96px,140px) 1fr;gap:2px 12px;font-size:12px;line-height:1.4">
  <div class="har-kv__k" style="color:#999">status</div><div class="har-kv__v" style="color:#ccc">{_escape(status_label)}</div>
  <div class="har-kv__k" style="color:#999">mimeType</div><div class="har-kv__v" style="color:#ccc">{_escape(mime)}</div>
  <div class="har-kv__k" style="color:#999">size</div><div class="har-kv__v" style="color:#ccc">{_escape(_format_bytes(size))}</div>
</div>
<div class="har-section__title" style="margin:8px 0 6px;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">Body</div>
<div class="har-muted har-body" style="color:#999;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere">{_escape(body_note)}</div>"""


def _build_entry(entry: dict) -> str:
    req = entry.get("request") or {}
    res = entry.get("response") or {}
    timings = entry.get("timings") or {}
    content = res.get("content") or {}
    method = (str(req.get("method") or "GET")).upper()
    url = str(req.get("url") or "")
    status = int(_num(res.get("status"), 0))
    status_text = str(res.get("statusText") or "")
    size = _response_size(entry)
    time_ms = max(_num(entry.get("time"), 0), 0)
    mime = str(content.get("mimeType") or "") or "—"
    col = "display:grid;grid-template-columns:56px 48px minmax(0,1fr) 120px 72px 64px;gap:0 8px;align-items:center;padding:4px 8px"
    status_label = "—" if status == 0 else str(status)
    return f"""<tr class="har-row">
  <td style="padding:0;border-bottom:1px solid #3d444c;vertical-align:top">
    <details>
      <summary style="display:block;cursor:pointer;list-style:none;padding:0">
        <span style="{col};white-space:nowrap">
          <span class="har-method" style="font-weight:600;color:#89d185">{_escape(method)}</span>
          <span class="{_status_class(status)}" style="{_status_color(status)}">{status_label}</span>
          <span class="har-url" title="{_escape(url)}" style="overflow:hidden;text-overflow:ellipsis">{_escape(url)}</span>
          <span class="har-mime" style="color:#999;overflow:hidden;text-overflow:ellipsis">{_escape(mime)}</span>
          <span>{_escape(_format_bytes(size))}</span>
          <span>{time_ms:.0f} ms</span>
        </span>
      </summary>
      <div class="har-detail" style="padding:8px 12px 12px;background:rgba(0,0,0,0.18);white-space:normal">
        <div class="har-section__title" style="margin:0 0 6px;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">Response Headers</div>
        {_header_kv(res.get("headers"))}
        <div class="har-section__title" style="margin:10px 0 6px;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">Request Headers</div>
        {_header_kv(req.get("headers"))}
        <div class="har-section__title" style="margin:10px 0 6px;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">Timings</div>
        {_timings_panel(timings, time_ms)}
        <div class="har-section__title" style="margin:10px 0 6px;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">Response</div>
        {_response_panel(content, size, status, status_text)}
      </div>
    </details>
  </td>
</tr>"""


def _build_content(log: dict) -> str:
    entries = log.get("entries") if isinstance(log.get("entries"), list) else []
    if not entries:
        return '<div class="empty">No network entries captured.</div>'
    col = "display:grid;grid-template-columns:56px 48px minmax(0,1fr) 120px 72px 64px;gap:0 8px;align-items:center;padding:4px 8px"
    rows = "".join(_build_entry(e) for e in entries if isinstance(e, dict))
    return f"""<div class="har-viewer">
<div class="har-table-wrap" style="overflow:auto">
<table class="har-table" style="width:100%;border-collapse:collapse;font-size:12px;line-height:1.35;color:#ccc">
<thead><tr>
  <th style="padding:0;border-bottom:1px solid #3d444c;background:#1a1917;color:#999;font-weight:600;text-align:left">
    <div style="{col}">
      <span>Method</span><span>Status</span><span>URL</span><span>Type</span><span>Size</span><span>Time</span>
    </div>
  </th>
</tr></thead>
<tbody>{rows}</tbody>
</table>
</div>
</div>"""


def _build_summary(log: dict) -> str:
    entries = log.get("entries") if isinstance(log.get("entries"), list) else []
    total_bytes = 0
    total_ms = 0.0
    for entry in entries:
        if isinstance(entry, dict):
            total_ms += max(_num(entry.get("time"), 0), 0)
            total_bytes += _response_size(entry)
    return f"{len(entries)} requests | {_format_bytes(total_bytes)} | {total_ms / 1000:.1f}s"


def render(har_json: bytes | str) -> str:
    if not har_json:
        raise ValueError("harJson is empty")
    try:
        root = json.loads(har_json if isinstance(har_json, str) else har_json.decode("utf-8"))
        log = root.get("log")
        if not isinstance(log, dict):
            return _TEMPLATE.replace("__SUMMARY__", _escape("Invalid HAR")).replace(
                "__CONTENT__", '<div class="error">Missing log section</div>'
            )
        return _TEMPLATE.replace("__SUMMARY__", _escape(_build_summary(log))).replace(
            "__CONTENT__", _build_content(log)
        )
    except Exception as ex:  # noqa: BLE001 — mirror Java: never throw from render path
        return _TEMPLATE.replace("__SUMMARY__", _escape("Parse error")).replace(
            "__CONTENT__",
            f'<div class="error">Failed to render HAR: {_escape(ex)}</div>',
        )
