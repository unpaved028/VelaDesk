-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SLA_Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "name" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "responseHours" INTEGER NOT NULL DEFAULT 4,
    "resolutionHours" INTEGER NOT NULL DEFAULT 24,
    CONSTRAINT "SLA_Policy_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SLA_Policy" ("id", "name", "resolutionHours", "responseHours", "tenantId", "workspaceId") SELECT "id", "name", "resolutionHours", "responseHours", "tenantId", "workspaceId" FROM "SLA_Policy";
DROP TABLE "SLA_Policy";
ALTER TABLE "new_SLA_Policy" RENAME TO "SLA_Policy";
CREATE INDEX "SLA_Policy_tenantId_idx" ON "SLA_Policy"("tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
