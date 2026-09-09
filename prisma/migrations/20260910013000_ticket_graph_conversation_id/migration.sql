-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "graphConversationId" TEXT;

-- CreateIndex
CREATE INDEX "Ticket_tenantId_graphConversationId_idx" ON "Ticket"("tenantId", "graphConversationId");
