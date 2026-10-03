#!/usr/bin/env bash
# Build the React app and upload to the S3 bucket created by Terraform.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TERRAFORM_DIR="$REPO_ROOT/terraform"
FRONTEND_DIR="$REPO_ROOT/frontend"

BUCKET="$(terraform -chdir="$TERRAFORM_DIR" output -raw frontend_s3_bucket)"
DISTRIBUTION_ID="$(terraform -chdir="$TERRAFORM_DIR" output -raw cloudfront_distribution_id)"
CLOUDFRONT_URL="$(terraform -chdir="$TERRAFORM_DIR" output -raw cloudfront_url)"

printf 'VITE_API_BASE_URL=/api\n' > "$FRONTEND_DIR/.env.production"
(cd "$FRONTEND_DIR" && npm ci && npm run build)
test -f "$FRONTEND_DIR/dist/index.html"

aws s3 sync "$FRONTEND_DIR/dist/" "s3://${BUCKET}/" --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "*.html"
aws s3 sync "$FRONTEND_DIR/dist/" "s3://${BUCKET}/" --delete \
  --cache-control "public,max-age=0,must-revalidate" \
  --exclude "*" \
  --include "*.html"

if [[ -n "$DISTRIBUTION_ID" ]]; then
  INVALIDATION_ID="$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)"
  aws cloudfront wait invalidation-completed \
    --distribution-id "$DISTRIBUTION_ID" \
    --id "$INVALIDATION_ID"
fi

echo "Done. Open: ${CLOUDFRONT_URL}"
