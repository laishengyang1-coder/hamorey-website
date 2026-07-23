#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/hamorey/apps/web}"
API_ROOT="${API_ROOT:-/opt/hamorey/apps/api}"
REPO_DIR="${REPO_DIR:-/opt/hamorey/source/hamorey-website}"
REPO_URL="${REPO_URL:-https://github.com/laishengyang1-coder/hamorey-website.git}"
API_ENV_FILE="${API_ENV_FILE:-/etc/hamorey/api.env}"

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
  git clone "$REPO_URL" "$REPO_DIR"
else
  cd "$REPO_DIR"
  git fetch --all --prune
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
    listen 80;
    server_name _;

    root $APP_ROOT/current;
    index index.html;
    client_max_body_size 30m;

    access_log /var/log/hamorey/web.access.log;
    error_log /var/log/hamorey/web.error.log;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
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
