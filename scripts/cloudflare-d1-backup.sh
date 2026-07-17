#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-hamorey-db}"
OUT_DIR="${OUT_DIR:-exports/cloudflare-d1}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$OUT_DIR/${DB_NAME}-${STAMP}.sql"

mkdir -p "$OUT_DIR"

cat <<MSG
About to export Cloudflare D1 database: $DB_NAME
Output: $OUT_FILE

Cloudflare D1 export can briefly pause database queries while the snapshot is
created. Run this during a quiet window when possible.
MSG

if [ "${1:-}" != "--yes" ]; then
  printf "Continue? Type YES: "
  read -r answer
  if [ "$answer" != "YES" ]; then
    echo "Cancelled."
    exit 1
  fi
fi

npx wrangler d1 export "$DB_NAME" --remote --output="$OUT_FILE"

echo
echo "D1 backup written to: $OUT_FILE"
echo "D1_BACKUP_DONE"
