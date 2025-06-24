#!/bin/bash

# Production build script for EducBlue Backend
# This script builds and deploys the backend application

set -e  # Exit on any error

echo "🚀 Starting production build process..."

# Check if environment variables are set
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create one based on .env.example"
    exit 1
fi

# Install dependencies
echo "📦 Installing production dependencies..."
npm ci --production

# Run linting (optional - can be skipped in production)
echo "🔍 Running linter..."
npm run lint || echo "⚠️  Linting issues found (non-blocking)"

# Run tests
echo "🧪 Running tests..."
npm test

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t educblue-backend:latest .

# Tag image with version
VERSION=$(node -p "require('./package.json').version")
docker tag educblue-backend:latest educblue-backend:$VERSION

echo "✅ Build completed successfully!"
echo "🏷️  Tagged as: educblue-backend:latest and educblue-backend:$VERSION"
echo ""
echo "To run in production:"
echo "  docker-compose --profile prod up -d"
echo ""
echo "To run in development:"
echo "  docker-compose --profile dev up"
