#!/bin/sh
# SQLite migrations without the Prisma CLI. Prisma 6's CLI needs effect/c12
# (not in the standalone image); npx would pull the wrong major as nextjs.
set -e
echo "Running database migrations..."
node --experimental-sqlite /app/scripts/apply-sqlite-migrations.mjs

echo "Starting VelaDesk..."
exec "$@"
