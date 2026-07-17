#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git unzip nginx build-essential

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q '^v22\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

sudo npm config set registry https://registry.npmmirror.com
sudo corepack disable || true
sudo npm install -g pnpm pm2 --force --registry=https://registry.npmmirror.com
pnpm config set registry https://registry.npmmirror.com

sudo mkdir -p /opt/hamorey/releases /opt/hamorey/shared/holding /opt/hamorey/apps /var/log/hamorey /etc/hamorey
sudo chown -R ubuntu:ubuntu /opt/hamorey /var/log/hamorey

cat >/opt/hamorey/shared/holding/index.html <<'HTML'
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hamorey Server Ready</title>
</head>
<body>
  <h1>Hamorey Server Ready</h1>
  <p>腾讯云部署环境已准备，等待备案与正式域名配置。</p>
</body>
</html>
HTML

cat >/tmp/hamorey-holding.conf <<'NGINX'
server {
    listen 8080;
    server_name _;
    root /opt/hamorey/shared/holding;
    index index.html;
    access_log /var/log/hamorey/holding.access.log;
    error_log /var/log/hamorey/holding.error.log;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

sudo mv /tmp/hamorey-holding.conf /etc/nginx/sites-available/hamorey-holding
sudo ln -sf /etc/nginx/sites-available/hamorey-holding /etc/nginx/sites-enabled/hamorey-holding
sudo nginx -t
sudo systemctl reload nginx

sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu || true
pm2 save --force

node -v
npm -v
pnpm -v
pm2 -v
systemctl is-active nginx
curl -I 127.0.0.1 | head -n 1
curl -I 127.0.0.1:8080 | head -n 1
echo "HAMOREY_RUNTIME_READY"
