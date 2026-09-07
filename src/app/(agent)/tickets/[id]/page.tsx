import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { ConversationView } from "@/components/tickets/ConversationView";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params;
  const ticketId = parseInt(id);

  if (isNaN(ticketId)) {
    return (
      <main className="flex h-full flex-1 items-center justify-center overflow-hidden bg-surface-container-lowest">
        <p className="text-on-surface-variant font-bold">Invalid Ticket ID</p>
      </main>
    );
  }

  return <ConversationView ticketId={ticketId} />;
}
