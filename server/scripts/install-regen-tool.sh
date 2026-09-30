#!/usr/bin/env bash
# ============================================================
# install-regen-tool.sh — 安装/修复 regen-certificate 自愈启动器
#
# 幂等，可重复执行：用于重建服务器、或部署后手动修复。
# 做三件事：
#   1) 把启动器安装到 /opt/hamorey/scripts/regen-certificate.mjs
#      （优先取部署产物 /opt/hamorey/releases/<DEPLOYED_COMMIT>/server/scripts/regen-launcher.mjs，
#       保证与当前部署提交一致；取不到则回退到本脚本同目录的 regen-launcher.mjs）
#   2) 建立依赖软链 /opt/hamorey/scripts/node_modules -> /opt/hamorey/apps/api/node_modules
#      （产物是 ESM，bare import 不认 NODE_PATH，需靠目录向上查找命中）
#   3) 预热一次，触发启动器自愈构建
#
# 用法：
#   server/scripts/install-regen-tool.sh [releaseRoot]
#   （releaseRoot 缺省 = /opt/hamorey/releases/$(cat /opt/hamorey/apps/DEPLOYED_COMMIT)）
# ============================================================
set -euo pipefail

SCRIPTS_DIR=/opt/hamorey/scripts
TOOL_DIR="$SCRIPTS_DIR/regen"
DEPLOYED_COMMIT_FILE=/opt/hamorey/apps/DEPLOYED_COMMIT
RELEASES_DIR=/opt/hamorey/releases
APPS_API_NODE_MODULES=/opt/hamorey/apps/api/node_modules

COMMIT="$(cat "$DEPLOYED_COMMIT_FILE" 2>/dev/null || true)"
REL="${1:-$RELEASES_DIR/$COMMIT}"

# 1) 安装启动器
LAUNCHER_SRC="$REL/server/scripts/regen-launcher.mjs"
if [ ! -f "$LAUNCHER_SRC" ]; then
  LAUNCHER_SRC="$(cd "$(dirname "$0")" && pwd)/regen-launcher.mjs"
fi
if [ ! -f "$LAUNCHER_SRC" ]; then
  echo "错误：找不到启动器源（试过 $REL/server/scripts/regen-launcher.mjs 与脚本同目录）。" >&2
  exit 1
fi
install -m 0755 "$LAUNCHER_SRC" "$SCRIPTS_DIR/regen-certificate.mjs"
echo "已安装启动器 → $SCRIPTS_DIR/regen-certificate.mjs（来源 $LAUNCHER_SRC）"

# 2) 依赖解析软链
mkdir -p "$TOOL_DIR"
ln -sfn "$APPS_API_NODE_MODULES" "$SCRIPTS_DIR/node_modules"
echo "已建立依赖软链 → $SCRIPTS_DIR/node_modules -> $APPS_API_NODE_MODULES"

# 3) 预热一次，触发自愈构建（无参数会打印用法并 exit 2，这里容忍）
set +e
node "$SCRIPTS_DIR/regen-certificate.mjs" >/dev/null 2>&1
set -e
if [ -f "$TOOL_DIR/regen-certificate.mjs" ]; then
  echo "构建产物就绪 → $TOOL_DIR/regen-certificate.mjs"
else
  echo "错误：构建产物未生成，请手动运行一次启动器查看报错。" >&2
  exit 1
fi
