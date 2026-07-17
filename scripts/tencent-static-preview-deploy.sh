#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/hamorey/apps/web}"
REPO_DIR="$APP_ROOT/repo"
CURRENT_DIR="$APP_ROOT/current"
REPO_URL="${REPO_URL:-https://github.com/laishengyang1-coder/hamorey-website.git}"
API_PROXY_TARGET="${API_PROXY_TARGET:-https://hemoppf.com}"

sudo mkdir -p "$APP_ROOT" /var/log/hamorey
sudo chown -R ubuntu:ubuntu /opt/hamorey /var/log/hamorey

if [ ! -d "$REPO_DIR/.git" ]; then
  git clone "$REPO_URL" "$REPO_DIR"
else
  cd "$REPO_DIR"
  git fetch origin
  git reset --hard origin/main
fi

cd "$REPO_DIR"
npm config set registry https://registry.npmmirror.com
npm ci
npm run build

rm -rf "$CURRENT_DIR"
mkdir -p "$CURRENT_DIR"
cp -R dist/. "$CURRENT_DIR"/

cat >/tmp/hamorey-web.conf <<NGINX
server {
    listen 80;
    server_name _;

    root $CURRENT_DIR;
    index index.html;
    client_max_body_size 30m;

    access_log /var/log/hamorey/web.access.log;
    error_log /var/log/hamorey/web.error.log;

    location /api/ {
        proxy_pass $API_PROXY_TARGET/api/;
        proxy_ssl_server_name on;
        proxy_set_header Host hemoppf.com;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / {
        try_files \\$uri \\$uri/ /index.html;
    }
}
NGINX

sudo mv /tmp/hamorey-web.conf /etc/nginx/sites-available/hamorey-web
sudo ln -sf /etc/nginx/sites-available/hamorey-web /etc/nginx/sites-enabled/hamorey-web
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "commit:"
git rev-parse --short HEAD
echo "local check:"
curl -I 127.0.0.1 | head -n 1
curl -I 127.0.0.1/api/health | head -n 1
echo "HAMOREY_STATIC_PREVIEW_DEPLOYED"
