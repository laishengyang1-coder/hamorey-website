#!/usr/bin/env bash
set -euo pipefail

API_ENV_FILE="${API_ENV_FILE:-/etc/hamorey/api.env}"
API_ROOT="${API_ROOT:-/opt/hamorey/apps/api}"
BACKUP_DIR="${BACKUP_DIR:-/opt/hamorey/backups/mysql}"
LOCAL_RETENTION_DAYS="${LOCAL_RETENTION_DAYS:-7}"

if [ ! -f "$API_ENV_FILE" ]; then
  echo "Missing $API_ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$API_ENV_FILE"
set +a

for required_var in MYSQL_HOST MYSQL_PORT MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE COS_SECRET_ID COS_SECRET_KEY COS_BUCKET COS_REGION; do
  if [ -z "${!required_var:-}" ]; then
    echo "Missing $required_var in $API_ENV_FILE" >&2
    exit 1
  fi
done

if ! command -v mysqldump >/dev/null 2>&1; then
  echo "mysqldump is not installed" >&2
  exit 1
fi

timestamp="$(date +%Y%m%d-%H%M%S)"
file_name="hamorey-mysql-${timestamp}.sql.gz"
backup_file="$BACKUP_DIR/$file_name"
temporary_file="${backup_file}.tmp"

mkdir -p "$BACKUP_DIR"
trap 'rm -f "$temporary_file"' EXIT

export MYSQL_PWD="$MYSQL_PASSWORD"
mysqldump \
  --protocol=TCP \
  --host="$MYSQL_HOST" \
  --port="$MYSQL_PORT" \
  --user="$MYSQL_USER" \
  --single-transaction \
  --quick \
  --routines \
  --events \
  --triggers \
  --no-tablespaces \
  --set-gtid-purged=OFF \
  "$MYSQL_DATABASE" | gzip -9 >"$temporary_file"
unset MYSQL_PWD

mv "$temporary_file" "$backup_file"
node "$API_ROOT/scripts/upload-mysql-backup.mjs" "$backup_file" "backups/mysql/$file_name"
find "$BACKUP_DIR" -type f -name 'hamorey-mysql-*.sql.gz' -mtime "+$LOCAL_RETENTION_DAYS" -delete

echo "HAMOREY_DB_BACKUP_DONE $file_name"
