-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "parentId" INTEGER;

-- CreateIndex
CREATE INDEX "Ticket_parentId_idx" ON "Ticket"("parentId");
