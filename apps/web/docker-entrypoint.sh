#!/bin/sh
set -e

echo "Running database migrations..."
cd /app
bun run repo db:migrate --app web

echo "Starting server..."
cd /app/apps/web
exec bun run start
