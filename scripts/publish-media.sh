#!/usr/bin/env bash
# Publish web-ready videos/audio to the serving bucket's media/ prefix (served by
# CloudFront), then invalidate /media/*. Photos are NOT published here — they live
# in the repo (src/content/trips/_media) and ship through the normal site build.
#
# Reads from .envrc (direnv): MEDIA_MASTERS_DIR (or MEDIA_PUBLISH_DIR), S3_BUCKET,
# CLOUDFRONT_DISTRIBUTION_ID, AWS_PROFILE.
# Pass extra aws flags through, e.g. `scripts/publish-media.sh --dryrun`.
set -euo pipefail

: "${S3_BUCKET:?set S3_BUCKET in .envrc (the serving bucket)}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?set CLOUDFRONT_DISTRIBUTION_ID in .envrc}"

# Web-ready videos/audio to publish, mirroring the media/<trip>/ layout.
WEB_DIR="${MEDIA_PUBLISH_DIR:-${MEDIA_MASTERS_DIR:?set MEDIA_MASTERS_DIR or MEDIA_PUBLISH_DIR in .envrc}/web}"
[ -d "$WEB_DIR" ] || { echo "Web media dir not found: $WEB_DIR" >&2; exit 1; }

echo "Publishing  $WEB_DIR/  ->  s3://$S3_BUCKET/media/"
# No --delete: removing a local file won't yank a served asset. Long, immutable cache
# (use versioned filenames when you change a clip).
aws s3 sync "$WEB_DIR/" "s3://$S3_BUCKET/media/" \
  --exclude ".DS_Store" \
  --cache-control "public,max-age=31536000,immutable" \
  "$@"

echo "Invalidating /media/* on $CLOUDFRONT_DISTRIBUTION_ID"
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/media/*" >/dev/null
echo "Publish complete."
