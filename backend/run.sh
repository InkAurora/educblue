#!/bin/bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Clean branch name for Docker naming (replace invalid characters)
CLEAN_BRANCH=$(echo "$BRANCH" | sed 's/[^a-zA-Z0-9._-]/-/g' | tr '[:upper:]' '[:lower:]')

# Set project name based on branch to create separate containers
export COMPOSE_PROJECT_NAME="educblue-$CLEAN_BRANCH"

if [ "$BRANCH" = "main" ]; then
  export NODE_ENV=production
  export PORT=80
  export COMPOSE_IGNORE_VOLUMES=true  # Skip volumes in prod
else
  export NODE_ENV=development
  export PORT=5000
fi

echo "Starting containers for branch: $BRANCH"
echo "Project name: $COMPOSE_PROJECT_NAME"
echo "Environment: $NODE_ENV"
echo "Port: $PORT"

# Build and start containers with branch-specific naming (force rebuild without cache)
docker-compose build --no-cache
docker-compose up