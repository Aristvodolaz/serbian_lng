#!/usr/bin/env python3
"""Local proxy: Claude Desktop ↔ llm.office.lan with model name remapping.

Desktop requires Anthropic-looking model IDs (claude-opus-*, claude-sonnet-*).
Your gateway only allows: architect, code, code-fast.
This proxy accepts Desktop names and rewrites them before forwarding.
"""
from __future__ import annotations

import json
import ssl
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

UPSTREAM = "https://llm.office.lan"
HOST = "127.0.0.1"
PORT = 8787

MODEL_MAP = {
    "claude-opus-4-6": "architect",
    "claude-opus-4-5": "architect",
    "claude-opus-4": "architect",
    "claude-3-opus": "architect",
    "opus": "architect",
    "architect": "architect",
    "claude-sonnet-4-5": "code",
    "claude-sonnet-4-6": "code",
    "claude-sonnet-4": "code",
    "claude-3-5-sonnet": "code",
    "sonnet": "code",
    "code": "code",
    "claude-haiku-4-5": "code-fast",
    "claude-haiku-4": "code-fast",
    "claude-3-5-haiku": "code-fast",
    "haiku": "code-fast",
    "code-fast": "code-fast",
}

FAKE_MODELS = [
    {
        "id": "claude-opus-4-6",
        "display_name": "Opus → architect",
        "type": "model",
        "created_at": "2025-01-01T00:00:00Z",
        "anthropic_family_tier": "opus",
        "is_family_default": True,
    },
    {
        "id": "claude-sonnet-4-5",
        "display_name": "Sonnet → code",
        "type": "model",
        "created_at": "2025-01-01T00:00:00Z",
        "anthropic_family_tier": "sonnet",
        "is_family_default": True,
    },
    {
        "id": "claude-haiku-4-5",
        "display_name": "Haiku → code-fast",
        "type": "model",
        "created_at": "2025-01-01T00:00:00Z",
        "anthropic_family_tier": "haiku",
        "is_family_default": True,
    },
]


def remap_model(name: str) -> str:
    if not name:
        return "code"
    lower = name.lower().strip()
    if lower in MODEL_MAP:
        return MODEL_MAP[lower]
    if "opus" in lower or "architect" in lower:
        return "architect"
    if "haiku" in lower or "code-fast" in lower:
        return "code-fast"
    if "sonnet" in lower or lower == "code":
        return "code"
    return "code"


def ssl_context() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("[llm-proxy] " + (fmt % args) + "\n")

    def _read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", "0") or 0)
        return self.rfile.read(length) if length else b""

    def _send(self, code: int, body: bytes, content_type: str = "application/json") -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        if path.rstrip("/").endswith("/v1/models") or path.rstrip("/") == "/models":
            payload = json.dumps({"data": FAKE_MODELS, "object": "list"}).encode()
            self._send(200, payload)
            return
        self._proxy()

    def do_POST(self) -> None:
        self._proxy()

    def do_PUT(self) -> None:
        self._proxy()

    def do_DELETE(self) -> None:
        self._proxy()

    def _proxy(self) -> None:
        body = self._read_body()
        content_type = self.headers.get("Content-Type", "")

        if body and "json" in content_type:
            try:
                data = json.loads(body)
                if isinstance(data, dict) and "model" in data:
                    original = data["model"]
                    data["model"] = remap_model(str(original))
                    if data["model"] != original:
                        self.log_message("remap model %r → %r", original, data["model"])
                    body = json.dumps(data).encode()
            except Exception as exc:  # noqa: BLE001
                self.log_message("json rewrite skipped: %s", exc)

        headers = {}
        for key in (
            "Authorization",
            "x-api-key",
            "anthropic-version",
            "anthropic-beta",
            "content-type",
            "accept",
            "user-agent",
        ):
            val = self.headers.get(key)
            if val:
                headers[key] = val

        if "Authorization" not in headers and "x-api-key" in headers:
            headers["Authorization"] = f"Bearer {headers['x-api-key']}"

        url = UPSTREAM.rstrip("/") + self.path
        req = Request(url, data=body if body else None, headers=headers, method=self.command)

        try:
            with urlopen(req, context=ssl_context(), timeout=600) as resp:
                resp_body = resp.read()
                self.send_response(resp.status)
                ct = resp.headers.get("Content-Type", "application/json")
                self.send_header("Content-Type", ct)
                self.send_header("Content-Length", str(len(resp_body)))
                self.send_header("Connection", "close")
                self.end_headers()
                self.wfile.write(resp_body)
        except HTTPError as exc:
            err_body = exc.read()
            self.log_message("upstream %s: %s", exc.code, err_body[:300])
            self._send(exc.code, err_body)
        except URLError as exc:
            msg = json.dumps(
                {"error": {"message": f"proxy upstream error: {exc}", "type": "proxy_error"}}
            ).encode()
            self.log_message("upstream error: %s", exc)
            self._send(502, msg)


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"[llm-proxy] listening on http://{HOST}:{PORT} → {UPSTREAM}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[llm-proxy] stopped", flush=True)


if __name__ == "__main__":
    main()
