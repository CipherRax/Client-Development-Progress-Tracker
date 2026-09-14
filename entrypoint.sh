#!/bin/sh
set -e

# Render injects PORT for the single public process (the Next.js server).
# The backend runs internally on 3000 and is reached through Next's rewrite.
PUBLIC_PORT="${PORT:-3000}"
export PORT=3000

echo "[entrypoint] Running database migrations..."
npx prisma migrate deploy

echo "[entrypoint] Starting NestJS API on internal port 3000..."
node dist/main.js &
BACKEND_PID=$!

echo "[entrypoint] Starting Next.js dashboard on public port ${PUBLIC_PORT}..."
cd /app/web/standalone/web
PORT="$PUBLIC_PORT" HOSTNAME=0.0.0.0 node server.js &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' TERM INT

wait $BACKEND_PID
wait $FRONTEND_PID