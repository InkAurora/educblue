#!/bin/bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
  export NODE_ENV=production
  export PORT=80
  export COMPOSE_IGNORE_VOLUMES=true  # Skip volumes in prod
else
  export NODE_ENV=development
  export PORT=5000
fi
docker-compose up --build