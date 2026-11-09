#!/usr/bin/env bash
# Deterministic <60-Second Rollback Runbook for Oracle OCI ARM64 VPS
set -euo pipefail

TARGET_SHA="${1:-}"
if [[ -z "$TARGET_SHA" ]]; then
  echo "Usage: ./scripts/rollback_vps.sh <previous_git_sha>"
  exit 1
fi

echo "[ROLLBACK] Reverting stack to verified image tag: $TARGET_SHA"
export IMAGE_TAG="$TARGET_SHA"
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
echo "[ROLLBACK] Completed rollback to $TARGET_SHA."
