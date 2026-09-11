#!/usr/bin/env bash
# ==============================================================================
# Workmate - Production Deploy Script
# Builds and restarts containers with zero downtime / automatic migrations
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "=========================================================="
echo " Starting Workmate Deployment"
echo "=========================================================="

# 1. Check for .env.production
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found in ${ROOT_DIR}."
    echo "Please copy .env.production.example to .env.production and configure your secrets:"
    echo "  cp .env.production.example .env.production"
    echo "  nano .env.production"
    exit 1
fi

# 2. Build and launch services
echo "[1/3] Building and starting Docker containers..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build --remove-orphans

# 3. Wait for services to become healthy
echo "[2/3] Waiting for services to initialize and become healthy..."
MAX_ATTEMPTS=24
ATTEMPT=0
HEALTHY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    BACKEND_STATUS=$(docker inspect --format='{{.State.Health.Status}}' workmate-backend 2>/dev/null || echo "starting")
    MYSQL_STATUS=$(docker inspect --format='{{.State.Health.Status}}' workmate-mysql 2>/dev/null || echo "starting")
    
    echo "[$ATTEMPT/$MAX_ATTEMPTS] MySQL: $MYSQL_STATUS | Backend: $BACKEND_STATUS"
    
    if [ "$BACKEND_STATUS" = "healthy" ] && [ "$MYSQL_STATUS" = "healthy" ]; then
        HEALTHY=true
        break
    fi
    sleep 5
done

if [ "$HEALTHY" = true ]; then
    echo " All core services are healthy!"
else
    echo "⚠️ Warning: Services took longer than expected to become healthy."
    echo "Check container logs with:"
    echo "  docker compose -f docker-compose.prod.yml logs backend"
fi

# 4. Display service status
echo "[3/3] Deployment status:"
docker compose -f docker-compose.prod.yml ps

echo "=========================================================="
echo " Deployment Completed!"
echo "=========================================================="
