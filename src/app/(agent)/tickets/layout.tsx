import React from 'react';
import { TicketQueue } from "@/components/tickets/TicketQueue";
import { ContextPanel } from "@/components/tickets/ContextPanel";

export default async function AgentLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-1 h-full overflow-hidden w-full min-h-0">
      {/* 3. Ticket Queue */}
      <TicketQueue />

      {/* 4. Conversation View (Children) */}
      <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
        {children}
      </div>

      {/* 5. Context Panel */}
      <ContextPanel ticketId={id ? parseInt(id) : undefined} />
    </div>
  );
}
