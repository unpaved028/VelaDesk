-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "inboundWebhookSecret" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isCustomerAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "externalAlertId" TEXT;

-- CreateIndex
CREATE INDEX "Ticket_tenantId_externalAlertId_idx" ON "Ticket"("tenantId", "externalAlertId");
