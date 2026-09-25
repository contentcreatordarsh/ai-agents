"""
StrikeMap origin — Tactical Atlas on EC2 + assignment /debug/headers.
"""

from __future__ import annotations

import json
import threading
from pathlib import Path

from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
VOTES_FILE = DATA_DIR / "votes.json"
MAPS_FILE = DATA_DIR / "maps.json"

app = Flask(__name__, template_folder="templates", static_folder="static")
_lock = threading.Lock()


def _load_maps() -> dict:
    with MAPS_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def _load_votes() -> dict[str, int]:
    if not VOTES_FILE.exists():
        return {}
    with VOTES_FILE.open(encoding="utf-8") as f:
        data = json.load(f)
    return {str(k): int(v) for k, v in data.get("votes", {}).items()}


def _save_votes(votes: dict[str, int]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with VOTES_FILE.open("w", encoding="utf-8") as f:
        json.dump({"votes": votes}, f)


def format_headers() -> str:
    lines = [f"{name}: {value}" for name, value in request.headers.items()]
    lines.sort(key=str.lower)
    return "\n".join(lines) + ("\n" if lines else "")


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/debug/headers")
def debug_headers():
    return format_headers(), 200, {"Content-Type": "text/plain; charset=utf-8"}


@app.get("/api/maps")
def api_maps():
    return jsonify(_load_maps())


@app.get("/api/votes")
def api_votes_get():
    with _lock:
        return jsonify({"votes": _load_votes()})


@app.post("/api/vote")
def api_vote():
    payload = request.get_json(silent=True) or {}
    callout_id = payload.get("calloutId")
    if not callout_id or not isinstance(callout_id, str):
        return jsonify({"error": "calloutId required"}), 400

    maps = _load_maps()
    valid_ids = {c["id"] for m in maps.get("maps", []) for c in m.get("callouts", [])}
    if callout_id not in valid_ids:
        return jsonify({"error": "unknown callout"}), 400

    with _lock:
        votes = _load_votes()
        votes[callout_id] = votes.get(callout_id, 0) + 1
        _save_votes(votes)
        return jsonify({"ok": True, "calloutId": callout_id, "votes": votes})


@app.get("/api/geo")
def api_geo_origin():
    """Origin fallback when request is not edge-routed through a Worker."""
    country = request.headers.get("CF-IPCountry") or request.headers.get("Cf-Ipcountry")
    colo = request.headers.get("CF-Ray", "").split("-")[-1] if request.headers.get("CF-Ray") else None
    return jsonify({"country": country, "colo": colo, "source": "origin"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
