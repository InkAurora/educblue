# Production build script for EducBlue Backend (PowerShell)
# This script builds and deploys the backend application

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting production build process..." -ForegroundColor Green

# Check if environment variables are set
if (-Not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found. Please create one based on .env.example" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing production dependencies..." -ForegroundColor Yellow
npm ci --production

# Run linting (optional - can be skipped in production)
Write-Host "🔍 Running linter..." -ForegroundColor Yellow
try {
    npm run lint
} catch {
    Write-Host "⚠️  Linting issues found (non-blocking)" -ForegroundColor Yellow
}

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
npm test

# Build Docker image
Write-Host "🐳 Building Docker image..." -ForegroundColor Yellow
docker build -t educblue-backend:latest .

# Tag image with version
$version = (Get-Content package.json | ConvertFrom-Json).version
docker tag educblue-backend:latest "educblue-backend:$version"

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host "🏷️  Tagged as: educblue-backend:latest and educblue-backend:$version" -ForegroundColor Cyan
Write-Host ""
Write-Host "To run in production:" -ForegroundColor White
Write-Host "  docker-compose --profile prod up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "To run in development:" -ForegroundColor White
Write-Host "  docker-compose --profile dev up" -ForegroundColor Gray
