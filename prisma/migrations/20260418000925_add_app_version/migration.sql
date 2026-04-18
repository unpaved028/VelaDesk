-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "appVersion" TEXT NOT NULL DEFAULT '0.1.0',
    "baseUrl" TEXT NOT NULL DEFAULT 'http://localhost:3000',
    "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "systemEmailSender" TEXT NOT NULL DEFAULT 'noreply@taqet.local',
    "defaultWorkspaceId" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SystemConfig" ("baseUrl", "defaultTimezone", "defaultWorkspaceId", "id", "systemEmailSender", "updatedAt") SELECT "baseUrl", "defaultTimezone", "defaultWorkspaceId", "id", "systemEmailSender", "updatedAt" FROM "SystemConfig";
DROP TABLE "SystemConfig";
ALTER TABLE "new_SystemConfig" RENAME TO "SystemConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
