#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/hamorey/apps/web}"
API_ROOT="${API_ROOT:-/opt/hamorey/apps/api}"
REPO_DIR="${REPO_DIR:-/opt/hamorey/source/hamorey-website}"
REPO_URL="${REPO_URL:-https://github.com/laishengyang1-coder/hamorey-website.git}"
API_ENV_FILE="${API_ENV_FILE:-/etc/hamorey/api.env}"

retry_network_command() {
  local description="$1"
  shift

  for attempt in 1 2 3 4; do
    if "$@"; then
      return 0
    fi

    if [ "$attempt" -eq 4 ]; then
      echo "$description failed after $attempt attempts."
      return 1
    fi

    echo "$description failed; retrying in $((attempt * 3)) seconds ($attempt/4)."
    sleep "$((attempt * 3))"
  done
}

if [ ! -f "$API_ENV_FILE" ]; then
  echo "Missing $API_ENV_FILE"
  echo "Create it from server/.env.example after TencentDB MySQL and COS are ready."
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$API_ENV_FILE"
set +a

sudo mkdir -p /opt/hamorey/source "$APP_ROOT/current" "$API_ROOT" /var/log/hamorey
sudo chown -R ubuntu:ubuntu /opt/hamorey /var/log/hamorey

if [ ! -d "$REPO_DIR/.git" ]; then
  retry_network_command "GitHub clone" git clone "$REPO_URL" "$REPO_DIR"
else
  cd "$REPO_DIR"
  retry_network_command "GitHub fetch" git fetch --all --prune
  git reset --hard origin/main
fi

cd "$REPO_DIR"
DEPLOY_COMMIT="$(git rev-parse HEAD)"
echo "Deploying commit $DEPLOY_COMMIT"
npm config set registry https://registry.npmmirror.com
npm ci --include=dev
npm run build

rm -rf "$APP_ROOT/current"
mkdir -p "$APP_ROOT/current"
cp -R dist/. "$APP_ROOT/current"/

cd "$REPO_DIR/server"
npm config set registry https://registry.npmmirror.com
npm ci --include=dev
npm run build

find "$API_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -R "$REPO_DIR/server/." "$API_ROOT/"

cd "$API_ROOT"
if pm2 describe hamorey-api >/dev/null 2>&1; then
  pm2 restart hamorey-api --update-env
else
  pm2 start dist/index.js --name hamorey-api --update-env --time --env production --node-args=""
fi
pm2 save --force

cat >/tmp/hamorey-production.conf <<NGINX
server {
    listen 80 default_server;
    server_name _;

    root $APP_ROOT/current;
    index index.html;
    client_max_body_size 30m;
    server_tokens off;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml image/svg+xml font/ttf font/otf application/vnd.ms-fontobject;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    access_log /var/log/hamorey/web.access.log;
    error_log /var/log/hamorey/web.error.log;

    location /api/ {
        add_header Cache-Control "no-store" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location ^~ /assets/ {
        try_files \$uri =404;
        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        access_log off;
    }

    location = /index.html {
        try_files \$uri =404;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }
}
NGINX

sudo mv /tmp/hamorey-production.conf /etc/nginx/sites-available/hamorey-production
sudo ln -sf /etc/nginx/sites-available/hamorey-production /etc/nginx/sites-enabled/hamorey-production
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/hamorey-web
sudo nginx -t
sudo systemctl reload nginx

for attempt in $(seq 1 30); do
  if curl --fail --silent --show-error --max-time 3 127.0.0.1/api/health >/tmp/hamorey-health.json; then
    break
  fi
  if [ "$attempt" -eq 30 ]; then
    echo "API health check did not recover after deployment."
    exit 1
  fi
  sleep 1
done

printf '%s\n' "$DEPLOY_COMMIT" >/opt/hamorey/apps/DEPLOYED_COMMIT
curl --fail --silent --show-error --max-time 3 127.0.0.1/api/health
echo
echo "HAMOREY_PRODUCTION_DEPLOYED $DEPLOY_COMMIT"
