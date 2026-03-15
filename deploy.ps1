# Proxi Flow — Google Cloud Run Deployment Script
# Prerequisites: gcloud CLI installed and authenticated
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = $env:GCP_PROJECT_ID
$REGION = "us-central1"
$SERVICE_NAME = "proxi-flow"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

if (-not $PROJECT_ID) {
    Write-Host "ERROR: Set GCP_PROJECT_ID environment variable first." -ForegroundColor Red
    Write-Host "  `$env:GCP_PROJECT_ID = 'your-project-id'"
    exit 1
}

Write-Host "=== Proxi Flow Cloud Run Deployment ===" -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID"
Write-Host "Region:  $REGION"
Write-Host "Service: $SERVICE_NAME"
Write-Host ""

# Step 1: Build the container image
Write-Host "[1/3] Building container image..." -ForegroundColor Yellow
gcloud builds submit --tag $IMAGE_NAME --project $PROJECT_ID

# Step 2: Deploy to Cloud Run
Write-Host "[2/3] Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME `
    --platform managed `
    --region $REGION `
    --project $PROJECT_ID `
    --allow-unauthenticated `
    --set-env-vars "NODE_ENV=production" `
    --set-env-vars "GEMINI_API_KEY=$($env:GEMINI_API_KEY)" `
    --memory 512Mi `
    --cpu 1 `
    --timeout 300 `
    --concurrency 80 `
    --min-instances 0 `
    --max-instances 10

# Step 3: Get the service URL
Write-Host "[3/3] Deployment complete!" -ForegroundColor Green
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format "value(status.url)"
Write-Host ""
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs:"
Write-Host "  gcloud run services logs read $SERVICE_NAME --region $REGION --project $PROJECT_ID"
