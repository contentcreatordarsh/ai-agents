#!/usr/bin/env bash
# Restrict origin :443/:80 to Cloudflare IP ranges so clients cannot bypass the proxy.
# Run on the origin VM as root after reviewing Cloudflare's published IP list.
# https://www.cloudflare.com/ips/

set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

CF_IPV4_URL="https://www.cloudflare.com/ips-v4"
CF_IPV6_URL="https://www.cloudflare.com/ips-v6"

iptables -N CF_ALLOW 2>/dev/null || true
iptables -F CF_ALLOW

while read -r cidr; do
  [[ -z "${cidr}" ]] && continue
  iptables -A CF_ALLOW -s "${cidr}" -j ACCEPT
done < <(curl -fsSL "${CF_IPV4_URL}")

while read -r cidr; do
  [[ -z "${cidr}" ]] && continue
  ip6tables -A CF_ALLOW -s "${cidr}" -j ACCEPT 2>/dev/null || true
done < <(curl -fsSL "${CF_IPV6_URL}")

for port in 80 443; do
  iptables -A INPUT -p tcp --dport "${port}" -j CF_ALLOW
  iptables -A INPUT -p tcp --dport "${port}" -j DROP
done

echo "Applied iptables rules for TCP 80/443 (Cloudflare sources only)."
echo "Ensure SSH (22) remains reachable before disconnecting."
