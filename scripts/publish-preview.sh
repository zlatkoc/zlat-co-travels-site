#!/usr/bin/env bash
# Publish a DRAFT-INCLUSIVE preview of the whole site to an unguessable path:
#   https://travels.zlat.co/preview-$PREVIEW_TOKEN/en/
# The preview build sets PUBLIC_PREVIEW=1 (drafts visible, robots noindex, no
# sitemap) and base=/preview-$PREVIEW_TOKEN so every internal link stays inside
# the preview. The production deploy never touches preview-* keys.
# Rotate PREVIEW_TOKEN in .envrc to kill old links. Extra flags go to `aws s3 sync`.
set -euo pipefail

: "${S3_BUCKET:?set S3_BUCKET in .envrc}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?set CLOUDFRONT_DISTRIBUTION_ID in .envrc}"
: "${PREVIEW_TOKEN:?set PREVIEW_TOKEN in .envrc (e.g. openssl rand -hex 6)}"

echo "Building preview (drafts included) under /preview-$PREVIEW_TOKEN/"
PUBLIC_PREVIEW=1 PREVIEW_TOKEN="$PREVIEW_TOKEN" npm run build

aws s3 sync dist/ "s3://$S3_BUCKET/preview-$PREVIEW_TOKEN/" \
  --delete \
  --exclude ".DS_Store" \
  --cache-control "public,max-age=0,must-revalidate" \
  "$@"

aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/preview-$PREVIEW_TOKEN/*" >/dev/null

echo "Preview live: https://travels.zlat.co/preview-$PREVIEW_TOKEN/en/"
