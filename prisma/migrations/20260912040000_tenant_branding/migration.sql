-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "logoMime" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "logoData" BLOB;

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_tenantId_key_key" ON "EmailTemplate"("tenantId", "key");
CREATE INDEX "EmailTemplate_tenantId_idx" ON "EmailTemplate"("tenantId");
