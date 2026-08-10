#!/usr/bin/env bash
set -euo pipefail

export PATH=/usr/local/bin:/usr/bin:/bin

APP_ROOT="/opt/hamorey"
SOURCE_REPO="$APP_ROOT/source/hamorey-website"
RELEASE_ROOT="$APP_ROOT/releases"
LOCK_FILE="/tmp/hamorey-deploy.lock"
ORIGINAL_COMMAND="${SSH_ORIGINAL_COMMAND:-}"

exec 9>"$LOCK_FILE"
if ! /usr/bin/flock -n 9; then
  echo "A Hamorey production deployment is already running."
  exit 1
fi

if [ "$ORIGINAL_COMMAND" = "deploy" ]; then
  exec /bin/bash "$SOURCE_REPO/scripts/tencent-production-deploy.sh"
fi

if [[ "$ORIGINAL_COMMAND" =~ ^deploy-archive[[:space:]]+([0-9a-f]{40})$ ]]; then
  commit="${BASH_REMATCH[1]}"
  archive="$(mktemp "/tmp/hamorey-${commit}.XXXXXX.tar.gz")"
  release_dir="$RELEASE_ROOT/$commit"
  trap 'rm -f "$archive"' EXIT

  cat >"$archive"
  if [ ! -s "$archive" ]; then
    echo "Uploaded release archive is empty."
    exit 1
  fi
  if ! tar -tzf "$archive" >/dev/null; then
    echo "Uploaded release archive is invalid."
    exit 1
  fi
  if tar -tzf "$archive" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
    echo "Uploaded release archive contains an unsafe path."
    exit 1
  fi

  rm -rf "$release_dir"
  mkdir -p "$release_dir"
  tar -xzf "$archive" -C "$release_dir"

  REPO_DIR="$release_dir" \
  SKIP_GIT_FETCH=true \
  DEPLOY_COMMIT_OVERRIDE="$commit" \
    /bin/bash "$release_dir/scripts/tencent-production-deploy.sh"

  find "$RELEASE_ROOT" \
    -mindepth 1 \
    -maxdepth 1 \
    -type d \
    ! -name "$commit" \
    -exec rm -rf {} +
  exit 0
fi

echo "This key may only run the Hamorey production deployment."
exit 1
