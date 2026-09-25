"""
Origin server for the Cloudflare SE technical assignment.

Every request returns all incoming HTTP request headers in the response body.
Use plain text so results are easy to read during demos and curl tests.
"""

from __future__ import annotations

from flask import Flask, request

app = Flask(__name__)


def format_headers() -> str:
    lines = [f"{name}: {value}" for name, value in request.headers.items()]
    lines.sort(key=str.lower)
    return "\n".join(lines) + ("\n" if lines else "")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
def echo_headers(path: str):
    body = format_headers()
    return body, 200, {"Content-Type": "text/plain; charset=utf-8"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
