#!/bin/sh
# Use the Prisma CLI baked into the image. `npx prisma` downloads latest
# (wrong major) and fails as user nextjs (HOME=/nonexistent).
echo "Running database migrations..."
if [ -x /app/node_modules/.bin/prisma ]; then
  /app/node_modules/.bin/prisma migrate deploy --schema=/app/prisma/schema.prisma
elif [ -f /app/node_modules/prisma/build/index.js ]; then
  node /app/node_modules/prisma/build/index.js migrate deploy --schema=/app/prisma/schema.prisma
else
  echo "Prisma CLI not found in image; skipping migrate deploy."
fi

echo "Starting VelaDesk..."
exec "$@"