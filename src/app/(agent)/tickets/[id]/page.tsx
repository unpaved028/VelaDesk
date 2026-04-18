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
      <main className="flex-1 overflow-hidden bg-surface-container-lowest dark:bg-[#1a1f24] h-full flex items-center justify-center">
        <p className="text-on-surface-variant font-bold">Invalid Ticket ID</p>
      </main>
    );
  }

  return <ConversationView ticketId={ticketId} />;
}
