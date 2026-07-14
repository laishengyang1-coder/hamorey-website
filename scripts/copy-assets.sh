#!/bin/bash
# ============================================================
# 和膜 HAMOREY — 图片素材复制+重命名脚本
# 将原始中文文件名图片复制到 src/assets/ 并重命名为英文
# ============================================================

set -e

SOURCE_DIR="${1:-/Users/haiyan/Desktop/11111}"
TARGET_DIR="$(dirname "$0")/../src/assets"

mkdir -p "$TARGET_DIR"

declare -A FILE_MAP=(
  ["主图.png"]="hero-main.png"
  ["窗膜.jpeg"]="window-film.jpeg"
  ["车衣.jpeg"]="ppf.jpeg"
  ["TPU改色.jpeg"]="color-ppf.jpeg"
  ["天窗冰甲.jpeg"]="sunroof-film.jpeg"
  ["建筑家居膜.jpeg"]="architectural-film.jpeg"
)

for src_name in "${!FILE_MAP[@]}"; do
  target_name="${FILE_MAP[$src_name]}"
  src_path="$SOURCE_DIR/$src_name"
  target_path="$TARGET_DIR/$target_name"

  if [ -f "$src_path" ]; then
    cp "$src_path" "$target_path"
    echo "✓ Copied: $src_name → $target_name"
  else
    echo "✗ Not found: $src_path"
  fi
done

echo ""
echo "Done. Assets copied to: $TARGET_DIR"
ls -la "$TARGET_DIR"
