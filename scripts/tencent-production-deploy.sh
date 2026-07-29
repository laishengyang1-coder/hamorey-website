#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/hamorey/apps/web}"
API_ROOT="${API_ROOT:-/opt/hamorey/apps/api}"
REPO_DIR="${REPO_DIR:-/opt/hamorey/source/hamorey-website}"
REPO_URL="${REPO_URL:-https://github.com/laishengyang1-coder/hamorey-website.git}"
API_ENV_FILE="${API_ENV_FILE:-/etc/hamorey/api.env}"
LETSENCRYPT_WEBROOT="${LETSENCRYPT_WEBROOT:-/var/www/letsencrypt}"
LETSENCRYPT_CERT_NAME="${LETSENCRYPT_CERT_NAME:-hamorey-cn}"
FORMAL_SERVER_NAMES="hemoppf.cn www.hemoppf.cn system.hemoppf.cn api.hemoppf.cn"

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

install_build_dependencies() {
  local requires_vite="${1:-false}"

  # api.env exports NODE_ENV=production for the API. Do not let that omit Vite
  # and TypeScript while preparing the web build on the deployment host.
  env \
    -u NPM_CONFIG_OMIT \
    -u npm_config_omit \
    -u NPM_CONFIG_PRODUCTION \
    -u npm_config_production \
    NODE_ENV=development \
    timeout 10m npm ci --include=dev

  if [ "$requires_vite" = "true" ] && [ ! -x node_modules/.bin/vite ]; then
    echo "Frontend build dependencies were not installed: node_modules/.bin/vite is missing."
    exit 1
  fi
}

upsert_api_env() {
  local key="$1"
  local value="$2"
  local temp_file

  temp_file="$(mktemp)"
  sudo awk -v key="$key" -v value="$value" '
    $0 ~ "^" key "=" {
      print key "=" value
      found = 1
      next
    }
    { print }
    END {
      if (!found) {
        print key "=" value
      }
    }
  ' "$API_ENV_FILE" >"$temp_file"
  sudo install -m 600 -o ubuntu -g ubuntu "$temp_file" "$API_ENV_FILE"
  rm -f "$temp_file"
}

write_nginx_config() {
  local tls_ready="$1"

  sudo mkdir -p /etc/nginx/snippets "$LETSENCRYPT_WEBROOT"
  sudo chown -R www-data:www-data "$LETSENCRYPT_WEBROOT"

  cat >/tmp/hamorey-app-locations.conf <<NGINX
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
NGINX
  sudo mv /tmp/hamorey-app-locations.conf /etc/nginx/snippets/hamorey-app-locations.conf

  if [ "$tls_ready" = "true" ]; then
    cat >/tmp/hamorey-production.conf <<NGINX
server {
    listen 80;
    server_name $FORMAL_SERVER_NAMES;

    location ^~ /.well-known/acme-challenge/ {
        root $LETSENCRYPT_WEBROOT;
        default_type "text/plain";
        try_files \$uri =404;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 80 default_server;
    server_name _;
    include /etc/nginx/snippets/hamorey-app-locations.conf;
}

server {
    listen 443 ssl http2;
    server_name $FORMAL_SERVER_NAMES;

    ssl_certificate /etc/letsencrypt/live/$LETSENCRYPT_CERT_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$LETSENCRYPT_CERT_NAME/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;

    include /etc/nginx/snippets/hamorey-app-locations.conf;
}
NGINX
  else
    cat >/tmp/hamorey-production.conf <<NGINX
server {
    listen 80 default_server;
    server_name $FORMAL_SERVER_NAMES _;

    location ^~ /.well-known/acme-challenge/ {
        root $LETSENCRYPT_WEBROOT;
        default_type "text/plain";
        try_files \$uri =404;
    }

    include /etc/nginx/snippets/hamorey-app-locations.conf;
}
NGINX
  fi

  sudo mv /tmp/hamorey-production.conf /etc/nginx/sites-available/hamorey-production
  sudo ln -sf /etc/nginx/sites-available/hamorey-production /etc/nginx/sites-enabled/hamorey-production
  sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/hamorey-web
  sudo nginx -t
  sudo systemctl reload nginx
}

install_certbot_renewal_hook() {
  sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
  sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-hamorey-nginx >/dev/null <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
systemctl reload nginx
HOOK
  sudo chmod 755 /etc/letsencrypt/renewal-hooks/deploy/reload-hamorey-nginx
  sudo systemctl enable --now certbot.timer
}

install_database_backup_job() {
  if ! command -v mysqldump >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y mysql-client
  fi

  sudo install -d -m 750 -o ubuntu -g ubuntu /opt/hamorey/scripts /opt/hamorey/backups/mysql
  sudo install -m 750 -o ubuntu -g ubuntu "$REPO_DIR/scripts/backup-db.sh" /opt/hamorey/scripts/backup-db.sh
  sudo tee /etc/cron.d/hamorey-backup >/dev/null <<'CRON'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 3 * * * ubuntu /opt/hamorey/scripts/backup-db.sh >> /var/log/hamorey-backup.log 2>&1
CRON
  sudo chmod 644 /etc/cron.d/hamorey-backup
  sudo touch /var/log/hamorey-backup.log
  sudo chown ubuntu:ubuntu /var/log/hamorey-backup.log
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

# 商品封面使用固定的公开 COS 域名直出。它们是后台上传的营销图，文件名为
# UUID，且和质保施工照片分前缀隔离；因此可以长缓存且不会暴露质保图片。
if [ -z "${R2_PUBLIC_BASE_URL:-}" ] && [ -n "${COS_BUCKET:-}" ]; then
  R2_PUBLIC_BASE_URL="https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com"
  upsert_api_env "R2_PUBLIC_BASE_URL" "$R2_PUBLIC_BASE_URL"
fi
export R2_PUBLIC_BASE_URL

sudo mkdir -p /opt/hamorey/source "$APP_ROOT/current" "$API_ROOT" /var/log/hamorey
sudo chown -R ubuntu:ubuntu /opt/hamorey /var/log/hamorey

if [ "${SKIP_GIT_FETCH:-false}" = "true" ]; then
  cd "$REPO_DIR"
  echo "Skipping GitHub fetch; deploying the checked-out commit $(git rev-parse HEAD)."
elif [ ! -d "$REPO_DIR/.git" ]; then
  retry_network_command "GitHub clone" timeout 120s git -c http.version=HTTP/1.1 clone "$REPO_URL" "$REPO_DIR"
else
  cd "$REPO_DIR"
  git config --local http.version HTTP/1.1
  retry_network_command "GitHub fetch" timeout 120s git -c http.version=HTTP/1.1 fetch --all --prune
  git reset --hard origin/main
fi

cd "$REPO_DIR"
DEPLOY_COMMIT="$(git rev-parse HEAD)"
echo "Deploying commit $DEPLOY_COMMIT"
npm config set registry https://registry.npmmirror.com
install_build_dependencies true
timeout 10m npm run build

rm -rf "$APP_ROOT/current"
mkdir -p "$APP_ROOT/current"
cp -R dist/. "$APP_ROOT/current"/

cd "$REPO_DIR/server"
npm config set registry https://registry.npmmirror.com
install_build_dependencies false
timeout 5m npm run build

find "$API_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -R "$REPO_DIR/server/." "$API_ROOT/"

install_database_backup_job

cd "$API_ROOT"
# 给历史商品封面补齐 public-read。新上传的 reward-covers/ 由 COS 适配器
# 自动带上同样权限，施工照片等其它前缀不会受影响。
HAMOREY_ENV_FILE="$API_ENV_FILE" node scripts/publish-reward-covers.mjs

if pm2 describe hamorey-api >/dev/null 2>&1; then
  pm2 restart hamorey-api --update-env
else
  pm2 start dist/index.js --name hamorey-api --update-env --time --env production --node-args=""
fi
pm2 save --force

TLS_CERTIFICATE_PATH="/etc/letsencrypt/live/$LETSENCRYPT_CERT_NAME/fullchain.pem"
TLS_PRIVATE_KEY_PATH="/etc/letsencrypt/live/$LETSENCRYPT_CERT_NAME/privkey.pem"
TLS_READY=false
if [ -f "$TLS_CERTIFICATE_PATH" ] && [ -f "$TLS_PRIVATE_KEY_PATH" ]; then
  TLS_READY=true
fi

# Keep HTTP available for the ACME challenge before the first certificate exists.
write_nginx_config "$TLS_READY"

if [ "${ENABLE_LETSENCRYPT:-false}" = "true" ]; then
  if [ "$TLS_READY" = "false" ] && [ -z "${LETSENCRYPT_EMAIL:-}" ]; then
    echo "TLS certificate skipped: LETSENCRYPT_EMAIL is missing from $API_ENV_FILE."
  elif [ "$TLS_READY" = "false" ]; then
    sudo apt-get update
    sudo apt-get install -y certbot
    sudo certbot certonly \
      --webroot \
      --non-interactive \
      --agree-tos \
      --email "$LETSENCRYPT_EMAIL" \
      --cert-name "$LETSENCRYPT_CERT_NAME" \
      --keep-until-expiring \
      -w "$LETSENCRYPT_WEBROOT" \
      -d hemoppf.cn \
      -d www.hemoppf.cn \
      -d system.hemoppf.cn \
      -d api.hemoppf.cn

    TLS_READY=true
  fi

  if [ "$TLS_READY" = "true" ]; then
    install_certbot_renewal_hook
    write_nginx_config "$TLS_READY"

    upsert_api_env "CORS_ORIGIN" "https://hemoppf.cn,https://www.hemoppf.cn,https://system.hemoppf.cn"
    upsert_api_env "SITE_URL" "https://system.hemoppf.cn"
    set -a
    # shellcheck source=/dev/null
    source "$API_ENV_FILE"
    set +a
    pm2 restart hamorey-api --update-env
    pm2 save --force
  fi
fi

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

if [ "$TLS_READY" = "true" ]; then
  curl \
    --fail \
    --silent \
    --show-error \
    --max-time 10 \
    --resolve "api.hemoppf.cn:443:127.0.0.1" \
    https://api.hemoppf.cn/api/health >/tmp/hamorey-https-health.json
fi

printf '%s\n' "$DEPLOY_COMMIT" >/opt/hamorey/apps/DEPLOYED_COMMIT
curl --fail --silent --show-error --max-time 3 127.0.0.1/api/health
echo
if [ "$TLS_READY" = "true" ]; then
  echo "HAMOREY_HTTPS_READY $FORMAL_SERVER_NAMES"
else
  echo "HAMOREY_HTTP_ONLY"
fi
echo "HAMOREY_PRODUCTION_DEPLOYED $DEPLOY_COMMIT"
