#!/usr/bin/env bash
# ==============================================================================
# Workmate - Backend + MySQL Production Deploy Script
# Target: NestJS Backend & MySQL 8 on AWS EC2
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/apps/backend"

cd "${ROOT_DIR}"

echo "=========================================================="
echo " Starting Workmate Backend & MySQL Deployment"
echo "=========================================================="

# 1. Detect environment file location (apps/backend/.env.production or apps/backend/.env or root .env.production)
ENV_FILE=""
if [ -f "${BACKEND_DIR}/.env.production" ]; then
    ENV_FILE="${BACKEND_DIR}/.env.production"
elif [ -f "${BACKEND_DIR}/.env" ]; then
    ENV_FILE="${BACKEND_DIR}/.env"
elif [ -f "${ROOT_DIR}/.env.production" ]; then
    ENV_FILE="${ROOT_DIR}/.env.production"
elif [ -f "${ROOT_DIR}/.env" ]; then
    ENV_FILE="${ROOT_DIR}/.env"
else
    echo "❌ Error: Environment file not found."
    echo "Please create apps/backend/.env.production:"
    echo "  cp apps/backend/.env.production.example apps/backend/.env.production"
    echo "  nano apps/backend/.env.production"
    exit 1
fi

echo " Using environment file: ${ENV_FILE}"

# 2. Build and launch services using apps/backend/docker-compose.yml
echo "[1/3] Building and starting MySQL & NestJS backend containers..."
docker compose -f apps/backend/docker-compose.yml --env-file "${ENV_FILE}" up -d --build --remove-orphans

# 3. Wait for MySQL and Backend to become healthy
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
    echo " All backend services are healthy!"
else
    echo "⚠️ Warning: Services took longer than expected to become healthy."
    echo "Check container logs with:"
    echo "  docker compose -f apps/backend/docker-compose.yml logs backend"
fi

# 4. Display service status
echo "[3/3] Deployment status:"
docker compose -f apps/backend/docker-compose.yml ps

echo "=========================================================="
echo " Backend Deployment Completed Successfully!"
echo " Health endpoint: http://localhost:4000/health"
echo "=========================================================="
