#!/usr/bin/env bash
set -euo pipefail

SQL_FILE="${1:-}"
OUT_DIR="${OUT_DIR:-exports/cloudflare-d1}"

if [ -z "$SQL_FILE" ]; then
  SQL_FILE="$(ls -t "$OUT_DIR"/hamorey-db-*.sql 2>/dev/null | head -n 1 || true)"
fi

if [ -z "$SQL_FILE" ] || [ ! -f "$SQL_FILE" ]; then
  echo "Usage: bash scripts/cloudflare-d1-inventory.sh path/to/hamorey-db.sql"
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
TMP_DB="$(mktemp /tmp/hamorey-d1-inventory.XXXXXX.sqlite)"
SUMMARY_FILE="$OUT_DIR/inventory-summary-${STAMP}.csv"
FILE_KEYS_FILE="$OUT_DIR/r2-referenced-file-keys-${STAMP}.csv"

sqlite3 "$TMP_DB" < "$SQL_FILE"

sqlite3 "$TMP_DB" <<SQL > "$SUMMARY_FILE"
.headers on
.mode csv
SELECT 'organizations' AS table_name, COUNT(*) AS rows FROM organizations UNION ALL
SELECT 'users', COUNT(*) FROM users UNION ALL
SELECT 'product_models', COUNT(*) FROM product_models UNION ALL
SELECT 'warranty_codes', COUNT(*) FROM warranty_codes UNION ALL
SELECT 'warranty_records', COUNT(*) FROM warranty_records UNION ALL
SELECT 'warranty_photos', COUNT(*) FROM warranty_photos UNION ALL
SELECT 'certificate_files', COUNT(*) FROM certificate_files UNION ALL
SELECT 'points_ledger', COUNT(*) FROM points_ledger UNION ALL
SELECT 'rewards', COUNT(*) FROM rewards UNION ALL
SELECT 'redemptions', COUNT(*) FROM redemptions;
SQL

sqlite3 "$TMP_DB" <<SQL > "$FILE_KEYS_FILE"
.headers on
.mode csv
SELECT 'rewards.cover_file_key' AS source, id AS owner_id, cover_file_key AS file_key
FROM rewards
WHERE cover_file_key IS NOT NULL AND cover_file_key != ''
UNION ALL
SELECT 'warranty_photos.file_key', warranty_record_id, file_key
FROM warranty_photos
WHERE file_key IS NOT NULL AND file_key != ''
UNION ALL
SELECT 'warranty_photos.thumbnail_key', warranty_record_id, thumbnail_key
FROM warranty_photos
WHERE thumbnail_key IS NOT NULL AND thumbnail_key != ''
UNION ALL
SELECT 'certificate_files.file_key', warranty_record_id, file_key
FROM certificate_files
WHERE file_key IS NOT NULL AND file_key != ''
UNION ALL
SELECT 'import_batches.error_file_key', id, error_file_key
FROM import_batches
WHERE error_file_key IS NOT NULL AND error_file_key != ''
ORDER BY source, file_key;
SQL

rm -f "$TMP_DB"

echo "Summary: $SUMMARY_FILE"
echo "Referenced R2 file keys: $FILE_KEYS_FILE"
echo "D1_INVENTORY_DONE"
