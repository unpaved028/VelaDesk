-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "firstResponseAt" DATETIME;
ALTER TABLE "Ticket" ADD COLUMN "resolvedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "appVersion" TEXT NOT NULL DEFAULT '0.1.0',
    "baseUrl" TEXT NOT NULL DEFAULT 'http://localhost:3000',
    "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "systemEmailSender" TEXT NOT NULL DEFAULT 'noreply@veladesk.local',
    "defaultWorkspaceId" TEXT,
    "backupSchedule" TEXT NOT NULL DEFAULT '0 3 * * *',
    "backupTargetMailbox" TEXT,
    "backupTargetFolder" TEXT NOT NULL DEFAULT 'VelaDeskBackups',
    "cloudflareTunnelToken" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SystemConfig" ("appVersion", "backupSchedule", "backupTargetFolder", "backupTargetMailbox", "baseUrl", "defaultTimezone", "defaultWorkspaceId", "id", "systemEmailSender", "updatedAt") SELECT "appVersion", "backupSchedule", "backupTargetFolder", "backupTargetMailbox", "baseUrl", "defaultTimezone", "defaultWorkspaceId", "id", "systemEmailSender", "updatedAt" FROM "SystemConfig";
DROP TABLE "SystemConfig";
ALTER TABLE "new_SystemConfig" RENAME TO "SystemConfig";
CREATE TABLE "new_Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessStartTime" TEXT NOT NULL DEFAULT '08:00',
    "businessEndTime" TEXT NOT NULL DEFAULT '17:00',
    "businessDays" TEXT NOT NULL DEFAULT '1,2,3,4,5',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin'
);
INSERT INTO "new_Tenant" ("createdAt", "domain", "id", "name") SELECT "createdAt", "domain", "id", "name" FROM "Tenant";
DROP TABLE "Tenant";
ALTER TABLE "new_Tenant" RENAME TO "Tenant";
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
