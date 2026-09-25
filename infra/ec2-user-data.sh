#!/bin/bash
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git

install -d -m 0755 /opt/strikemap/origin
cat >/opt/strikemap/origin/app.py <<'PY'
from flask import Flask, request
app = Flask(__name__)

def format_headers() -> str:
    lines = [f"{name}: {value}" for name, value in request.headers.items()]
    lines.sort(key=str.lower)
    return "\n".join(lines) + ("\n" if lines else "")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
def echo_headers(path: str):
    return format_headers(), 200, {"Content-Type": "text/plain; charset=utf-8"}
PY

python3 -m venv /opt/strikemap/venv
/opt/strikemap/venv/bin/pip install --no-cache-dir flask==3.1.0 gunicorn==23.0.0

cat >/etc/systemd/system/strikemap-origin.service <<'UNIT'
[Unit]
Description=StrikeMap header origin
After=network.target

[Service]
WorkingDirectory=/opt/strikemap/origin
Environment=PATH=/opt/strikemap/venv/bin
ExecStart=/opt/strikemap/venv/bin/gunicorn -b 127.0.0.1:8080 -w 2 app:app
Restart=always

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now strikemap-origin.service

cat >/etc/nginx/sites-available/strikemap <<'NGX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name strikemap.space www.strikemap.space;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGX

ln -sf /etc/nginx/sites-available/strikemap /etc/nginx/sites-enabled/strikemap
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Certbot after DNS points here (run manually or second boot)
touch /var/log/strikemap-user-data.done
