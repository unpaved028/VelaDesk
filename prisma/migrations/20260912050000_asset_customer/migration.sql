-- AlterTable
ALTER TABLE "Asset" ADD COLUMN "location" TEXT;
ALTER TABLE "Asset" ADD COLUMN "customerId" TEXT;

-- CreateIndex
CREATE INDEX "Asset_customerId_idx" ON "Asset"("customerId");
