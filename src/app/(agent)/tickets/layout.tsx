import React from 'react';
import { TicketQueue } from "@/components/tickets/TicketQueue";
import { ContextPanel } from "@/components/tickets/ContextPanel";
import { prisma } from '@/lib/db/prisma';

export default async function AgentLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;
  
  // Fetch ticket for SLA data if ID exists
  const ticket = id ? await prisma.ticket.findUnique({
    where: { id: parseInt(id) },
    select: {
      slaResponseDeadline: true,
      slaResolutionDeadline: true,
      firstResponseAt: true,
      resolvedAt: true
    }
  }) : null;

  return (
    <div className="flex flex-1 h-full overflow-hidden w-full min-h-0">
      {/* 3. Ticket Queue */}
      <TicketQueue />

      {/* 4. Conversation View (Children) */}
      <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
        {children}
      </div>

      {/* 5. Context Panel */}
      <ContextPanel 
        ticketId={id ? parseInt(id) : undefined} 
        slaResponseDeadline={ticket?.slaResponseDeadline}
        slaResolutionDeadline={ticket?.slaResolutionDeadline}
        firstResponseAt={ticket?.firstResponseAt}
        resolvedAt={ticket?.resolvedAt}
      />
    </div>
  );
}
