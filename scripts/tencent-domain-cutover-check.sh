#!/usr/bin/env bash
set -euo pipefail

# Run this only after the ICP filing is approved and DNS records have been added.
SERVER_IP="${SERVER_IP:-134.175.187.12}"
DOMAINS=(
  "${ROOT_DOMAIN:-hemoppf.cn}"
  "${SYSTEM_DOMAIN:-system.hemoppf.cn}"
  "${API_DOMAIN:-api.hemoppf.cn}"
  "${WWW_DOMAIN:-www.hemoppf.cn}"
)

failed=0

resolve_ipv4() {
  local domain="$1"
  if command -v getent >/dev/null 2>&1; then
    getent ahostsv4 "$domain" | awk '{print $1}' | sort -u
    return
  fi

  if command -v dig >/dev/null 2>&1; then
    dig +short A "$domain" | sort -u
    return
  fi

  echo "Cannot resolve DNS: neither getent nor dig is available." >&2
  return 1
}

echo "Checking HAMOREY domain cutover prerequisites for $SERVER_IP"
for domain in "${DOMAINS[@]}"; do
  resolved="$(resolve_ipv4 "$domain" || true)"
  if printf '%s\n' "$resolved" | grep -Fxq "$SERVER_IP"; then
    echo "OK   $domain -> $SERVER_IP"
  else
    echo "WAIT $domain -> ${resolved:-no A record} (expected $SERVER_IP)"
    failed=1
  fi
done

if ! curl --fail --silent --show-error --max-time 5 "http://$SERVER_IP/api/health" >/dev/null; then
  echo "FAIL current Tencent API health check did not pass"
  failed=1
else
  echo "OK   current Tencent API health check"
fi

echo
echo "Before HTTPS cutover, confirm all of the following:"
echo "  1. ICP filing is approved and the site-specific ICP record number is ready for the website footer."
echo "  2. Tencent Cloud security group permits inbound TCP 80 and 443."
echo "  3. root/system/api/www A records all point to $SERVER_IP."
echo "  4. /etc/hamorey/api.env CORS_ORIGIN includes https://hemoppf.cn, https://system.hemoppf.cn and https://www.hemoppf.cn."
echo "  5. A TLS certificate is ready for hemoppf.cn, system.hemoppf.cn, api.hemoppf.cn and www.hemoppf.cn."
echo "  6. WeChat public platform request/upload/download domains are updated before a release build is submitted."

if [ "$failed" -ne 0 ]; then
  exit 1
fi

echo "HAMOREY_DOMAIN_CUTOVER_READY"
