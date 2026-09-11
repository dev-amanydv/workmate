#!/bin/sh
set -e

echo "[entrypoint] Checking database migrations..."
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Applying Prisma database migrations..."
  npx prisma migrate deploy || {
    echo "[entrypoint] Warning: prisma migrate deploy failed or timed out. Starting application anyway..."
  }
fi

echo "[entrypoint] Starting backend application..."
exec "$@"
