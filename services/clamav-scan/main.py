#!/usr/bin/env python3
"""Escaneo ClamAV en Cloud Run: descarga por URL firmada, clamscan, callback. minInstances=0."""
from __future__ import annotations

import json
import os
import subprocess
import tempfile
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

LISTEN_PORT = int(os.environ.get("PORT", "8080"))
SCAN_SECRET = os.environ.get("MALWARE_SCAN_SECRET", "").strip()
MAX_BYTES = 220 * 1024 * 1024


def authorized(handler: BaseHTTPRequestHandler) -> bool:
    if not SCAN_SECRET:
        return False
    return handler.headers.get("Authorization", "") == f"Bearer {SCAN_SECRET}"


def download(url: str, dest: str) -> None:
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=120) as resp, open(dest, "wb") as out:
        read = 0
        while True:
            chunk = resp.read(1024 * 256)
            if not chunk:
                break
            read += len(chunk)
            if read > MAX_BYTES:
                raise ValueError("file_too_large")
            out.write(chunk)


def clamscan(path: str) -> tuple[bool, str]:
    proc = subprocess.run(
        ["clamscan", "--no-summary", "--infected", path],
        capture_output=True,
        text=True,
        timeout=120,
    )
    # 0 = clean, 1 = infected, 2 = error
    if proc.returncode == 1:
        finding = "infected"
        for line in (proc.stdout or "").splitlines():
            if "FOUND" in line:
                parts = line.strip().split()
                if len(parts) >= 2:
                    finding = parts[-2][:80]
                break
        return True, finding
    if proc.returncode == 0:
        return False, ""
    raise RuntimeError("clamscan_error")


def callback(url: str, payload: dict) -> None:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {SCAN_SECRET}",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        resp.read()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        sys_stdout = __import__("sys").stderr
        sys_stdout.write("scan: " + (fmt % args) + "\n")

    def _json(self, code: int, payload: dict) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self) -> None:  # noqa: N802
        if self.path in ("/", "/health"):
            self._json(200, {"ok": True})
            return
        self._json(404, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/scan":
            self._json(404, {"error": "not_found"})
            return
        if not authorized(self):
            self._json(401, {"error": "unauthorized"})
            return
        length = int(self.headers.get("Content-Length") or "0")
        if length < 2 or length > 512_000:
            self._json(400, {"error": "bad_length"})
            return
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json(400, {"error": "invalid_json"})
            return

        collection = body.get("collection") or "submissions"
        submission_id = str(body.get("submissionId") or "").strip()
        callback_url = str(body.get("callbackUrl") or "").strip()
        files = body.get("files") or []
        if not submission_id or not callback_url or not isinstance(files, list):
            self._json(400, {"error": "missing_fields"})
            return

        infected = False
        finding = ""
        try:
            with tempfile.TemporaryDirectory() as tmp:
                for i, item in enumerate(files[:24]):
                    url = str((item or {}).get("url") or "")
                    if not url.startswith("https://"):
                        continue
                    dest = os.path.join(tmp, f"f{i}.bin")
                    download(url, dest)
                    hit, name = clamscan(dest)
                    if hit:
                        infected = True
                        finding = name
                        break
            callback(
                callback_url,
                {
                    "collection": collection,
                    "submissionId": submission_id,
                    "infected": infected,
                    "finding": finding,
                },
            )
            self._json(200, {"ok": True, "infected": infected})
        except Exception as exc:  # noqa: BLE001
            try:
                callback(
                    callback_url,
                    {
                        "collection": collection,
                        "submissionId": submission_id,
                        "infected": False,
                        "finding": "",
                        "error": "scan_failed",
                    },
                )
            except Exception:
                pass
            self._json(500, {"error": "scan_failed", "detail": str(exc)[:80]})


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", LISTEN_PORT), Handler).serve_forever()
