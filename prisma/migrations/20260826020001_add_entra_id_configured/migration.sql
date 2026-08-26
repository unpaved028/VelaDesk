-- Fresh databases that never db-pushed Entra fields need this column.
-- Local DBs that already have it should mark this migration as applied.
ALTER TABLE "SystemConfig" ADD COLUMN "entraIdConfigured" BOOLEAN NOT NULL DEFAULT false;
