#!/usr/bin/env bash
# Sync processed trip photos between the repo working tree and the site bucket's
# media-src/ prefix. Photos are gitignored (they'd bloat the repo) but must exist
# in src/content/*/_media for Astro to import + optimize them — so S3 is their
# source of truth and this script moves them around:
#
#   scripts/sync-photos.sh push   local _media dirs -> s3://$S3_BUCKET/media-src/
#   scripts/sync-photos.sh pull   s3://$S3_BUCKET/media-src/ -> local _media dirs
#
# `pull` runs in CI (deploy.yml) before the build, and on any fresh clone.
# media-src/ is never linked from the site; deploy syncs must --exclude it.
# Pass extra aws flags through, e.g. `scripts/sync-photos.sh push --dryrun`.
set -euo pipefail

: "${S3_BUCKET:?set S3_BUCKET in .envrc (the serving bucket)}"

MODE="${1:?usage: sync-photos.sh push|pull [aws flags...]}"
shift

TRIPS_DIR="src/content/trips/_media"
JOURNEYS_DIR="src/content/journeys/_media"
PREFIX="s3://$S3_BUCKET/media-src"

case "$MODE" in
  push)
    echo "Pushing  $TRIPS_DIR/ + $JOURNEYS_DIR/  ->  $PREFIX/"
    aws s3 sync "$TRIPS_DIR/" "$PREFIX/trips/" --exclude ".DS_Store" "$@"
    aws s3 sync "$JOURNEYS_DIR/" "$PREFIX/journeys/" --exclude ".DS_Store" "$@"
    ;;
  pull)
    echo "Pulling  $PREFIX/  ->  $TRIPS_DIR/ + $JOURNEYS_DIR/"
    mkdir -p "$TRIPS_DIR" "$JOURNEYS_DIR"
    aws s3 sync "$PREFIX/trips/" "$TRIPS_DIR/" "$@"
    aws s3 sync "$PREFIX/journeys/" "$JOURNEYS_DIR/" "$@"
    ;;
  *)
    echo "usage: sync-photos.sh push|pull [aws flags...]" >&2
    exit 1
    ;;
esac
echo "Sync complete."
