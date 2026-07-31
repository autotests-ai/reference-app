"""Client-side HAR from Chrome/Edge Performance logs (CDP Network events)."""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from typing import Any

from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.remote.webdriver import WebDriver


def supports_browser(browser: str | None) -> bool:
    if not browser:
        return False
    b = browser.lower()
    return "chrome" in b or "edge" in b or b == "chromium"


def enable_performance_logging(options: ChromeOptions, *, browser_logs: bool = False) -> None:
    prefs = {"performance": "ALL"}
    if browser_logs:
        prefs["browser"] = "ALL"
    options.set_capability("goog:loggingPrefs", prefs)


def get_logs(driver: WebDriver, log_type: str) -> list[dict]:
    """Selenium 4.46+ dropped WebDriver.get_log; Selenoid still serves /se/log."""
    try:
        if hasattr(driver, "get_log"):
            return list(driver.get_log(log_type) or [])
    except Exception:
        pass
    cmd = f"_se_get_log_{log_type}"
    try:
        driver.command_executor._commands[cmd] = ("POST", "/session/$sessionId/se/log")
        result = driver.execute(cmd, {"type": log_type})
        value = result.get("value") if isinstance(result, dict) else result
        return list(value or [])
    except Exception:
        return []


def collect_har_json(driver: WebDriver) -> bytes | None:
    entries = get_logs(driver, "performance")
    if not entries:
        return None
    try:
        har = _to_har(entries)
        return har.encode("utf-8")
    except Exception:
        return None


def _to_har(log_entries: list[dict]) -> str:
    requests: dict[str, dict[str, Any]] = {}
    responses: dict[str, dict[str, Any]] = {}
    finished_ms: dict[str, float] = {}
    encoded_bytes: dict[str, int] = {}
    order: list[str] = []
    wall_start = float("nan")

    for entry in log_entries:
        message_raw = entry.get("message")
        try:
            root = json.loads(message_raw) if isinstance(message_raw, str) else message_raw
        except (TypeError, json.JSONDecodeError):
            continue
        if not isinstance(root, dict):
            continue
        message_obj = root.get("message", root)
        if isinstance(message_obj, str):
            try:
                message = json.loads(message_obj)
            except json.JSONDecodeError:
                continue
        elif isinstance(message_obj, dict):
            message = message_obj
        else:
            continue
        method = message.get("method")
        params = message.get("params")
        if not isinstance(method, str) or not isinstance(params, dict):
            continue

        if method == "Network.requestWillBeSent":
            req_id = str(params.get("requestId") or "")
            request_obj = params.get("request")
            if not req_id or not isinstance(request_obj, dict):
                continue
            ts = _num(params.get("timestamp"), float("nan"))
            if ts == ts and wall_start != wall_start:  # wall_start is NaN
                wall_start = ts
            stored = {
                "url": str(request_obj.get("url") or ""),
                "method": str(request_obj.get("method") or ""),
                "headers": request_obj.get("headers")
                if isinstance(request_obj.get("headers"), dict)
                else {},
                "timestamp": ts,
            }
            if "wallTime" in params:
                stored["wallTime"] = _num(params.get("wallTime"), 0)
            if req_id not in requests:
                order.append(req_id)
            requests[req_id] = stored
        elif method == "Network.responseReceived":
            req_id = str(params.get("requestId") or "")
            response_obj = params.get("response")
            if req_id and isinstance(response_obj, dict):
                responses[req_id] = response_obj
        elif method == "Network.loadingFinished":
            req_id = str(params.get("requestId") or "")
            if req_id:
                finished_ms[req_id] = _num(params.get("timestamp"), 0)
                if "encodedDataLength" in params:
                    encoded_bytes[req_id] = int(_num(params.get("encodedDataLength"), 0))

    har_entries = []
    for req_id in order:
        req = requests.get(req_id)
        if not req:
            continue
        resp = responses.get(req_id, {})
        start = _num(req.get("timestamp"), float("nan"))
        end = finished_ms.get(req_id, start)
        if start == start and end == end and end >= start:
            time_ms = (end - start) * 1000.0
        else:
            time_ms = 0.0

        if "wallTime" in req:
            started_ms = int(_num(req["wallTime"], 0) * 1000.0)
        elif wall_start == wall_start and end == end:
            started_ms = int(time.time() * 1000 - (end - wall_start) * 1000.0)
        else:
            started_ms = int(time.time() * 1000)

        har_entries.append(
            {
                "startedDateTime": datetime.fromtimestamp(started_ms / 1000, tz=timezone.utc).isoformat(),
                "time": time_ms,
                "request": _har_request(req),
                "response": _har_response(resp, encoded_bytes.get(req_id)),
                "cache": {},
                "timings": _timings(time_ms),
            }
        )

    log = {
        "version": "1.2",
        "creator": {"name": "reference-app har_capture", "version": "1"},
        "pages": [
            {
                "startedDateTime": datetime.now(tz=timezone.utc).isoformat(),
                "id": "page_1",
                "title": "python-har",
                "pageTimings": {"onContentLoad": -1, "onLoad": -1},
            }
        ],
        "entries": har_entries,
    }
    return json.dumps({"log": log}, ensure_ascii=False)


def _har_request(req: dict) -> dict:
    method = str(req.get("method") or "") or "GET"
    return {
        "method": method,
        "url": str(req.get("url") or ""),
        "httpVersion": "HTTP/1.1",
        "cookies": [],
        "headers": _header_list(req.get("headers")),
        "queryString": [],
        "headersSize": -1,
        "bodySize": -1,
    }


def _har_response(resp: dict, finished_encoded: int | None) -> dict:
    size = finished_encoded if finished_encoded is not None else int(
        _num(resp.get("encodedDataLength"), 0)
    )
    protocol = str(resp.get("protocol") or "") or "HTTP/1.1"
    return {
        "status": int(_num(resp.get("status"), 0)),
        "statusText": str(resp.get("statusText") or ""),
        "httpVersion": protocol,
        "cookies": [],
        "headers": _header_list(resp.get("headers")),
        "content": {"size": size, "mimeType": str(resp.get("mimeType") or "")},
        "redirectURL": "",
        "headersSize": -1,
        "bodySize": -1,
    }


def _header_list(headers_obj: Any) -> list[dict[str, str]]:
    if not isinstance(headers_obj, dict):
        return []
    return [{"name": str(k), "value": "" if v is None else str(v)} for k, v in headers_obj.items()]


def _timings(total_ms: float) -> dict:
    return {
        "blocked": -1,
        "dns": -1,
        "connect": -1,
        "ssl": -1,
        "send": 0,
        "wait": max(0, total_ms),
        "receive": 0,
    }


def _num(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default
