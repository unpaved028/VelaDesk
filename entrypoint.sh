#!/bin/sh
# Führe ausstehende Prisma-Migrationen aus
echo "Running database migrations..."
npx prisma migrate deploy

# Starte die Anwendung
echo "Starting VelaDesk..."
exec "$@"