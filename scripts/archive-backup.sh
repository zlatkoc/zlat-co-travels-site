#!/usr/bin/env bash
# Back up the local media master store (originals + web-ready derivatives) to the
# private archive bucket. The archive is never served — it's just off-disk backup.
#
# Reads from .envrc (direnv): MEDIA_MASTERS_DIR, S3_ARCHIVE_BUCKET, AWS_PROFILE.
# Pass extra aws flags through, e.g. `scripts/archive-backup.sh --dryrun`.
set -euo pipefail

: "${MEDIA_MASTERS_DIR:?set MEDIA_MASTERS_DIR in .envrc (your local media store)}"
: "${S3_ARCHIVE_BUCKET:?set S3_ARCHIVE_BUCKET in .envrc}"

[ -d "$MEDIA_MASTERS_DIR" ] || { echo "Master store not found: $MEDIA_MASTERS_DIR" >&2; exit 1; }

echo "Backing up  $MEDIA_MASTERS_DIR/  ->  s3://$S3_ARCHIVE_BUCKET/"
aws s3 sync "$MEDIA_MASTERS_DIR/" "s3://$S3_ARCHIVE_BUCKET/" \
  --exclude ".DS_Store" \
  "$@"
echo "Backup complete."
