#!/bin/sh
set -e
echo "Running database migrations..."
npx prisma db push --accept-data-loss 2>/dev/null || npx prisma db push
echo "Starting server..."
exec npx tsx src/index.ts
