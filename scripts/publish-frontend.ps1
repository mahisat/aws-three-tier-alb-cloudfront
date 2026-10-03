# Build the React app and upload to the S3 bucket created by Terraform.
# Run from repo root after: cd terraform && terraform apply
# Requires: Node.js 20+, AWS CLI configured, Terraform in PATH

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$TerraformDir = Join-Path $RepoRoot "terraform"
$FrontendDir = Join-Path $RepoRoot "frontend"

Push-Location $TerraformDir
try {
    $Bucket = terraform output -raw frontend_s3_bucket
    $DistributionId = terraform output -raw cloudfront_distribution_id
    $CloudFrontUrl = terraform output -raw cloudfront_url
} finally {
    Pop-Location
}

if (-not $Bucket) {
    throw "Could not read frontend_s3_bucket from Terraform outputs. Run terraform apply first."
}

Push-Location $FrontendDir
try {
    Set-Content -Path ".env.production" -Value "VITE_API_BASE_URL=/api`n" -NoNewline
    npm ci
    npm run build
    if (-not (Test-Path "dist/index.html")) {
        throw "dist/index.html missing after build."
    }
} finally {
    Pop-Location
}

Write-Host "Syncing dist/ to s3://$Bucket/ ..."
aws s3 sync (Join-Path $FrontendDir "dist") "s3://$Bucket/" --delete `
    --cache-control "public,max-age=31536000,immutable" `
    --exclude "index.html" `
    --exclude "*.html"
aws s3 sync (Join-Path $FrontendDir "dist") "s3://$Bucket/" --delete `
    --cache-control "public,max-age=0,must-revalidate" `
    --exclude "*" `
    --include "*.html"

if ($DistributionId) {
    Write-Host "Creating CloudFront invalidation..."
    $InvalidationId = aws cloudfront create-invalidation `
        --distribution-id $DistributionId `
        --paths "/*" `
        --query "Invalidation.Id" `
        --output text
    aws cloudfront wait invalidation-completed --distribution-id $DistributionId --id $InvalidationId
}

Write-Host "Done. Open: $CloudFrontUrl"
