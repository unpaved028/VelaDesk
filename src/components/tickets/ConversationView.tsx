import React from 'react';
import { MessageSquare, CheckCircle, CircleDashed, UserCheck } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { ChatBubble } from './ChatBubble';
import { ReplyBox } from './ReplyBox';
import { StatusActions } from './StatusActions';
import { SLACountdown } from './SLACountdown';
import { AuditTimelineEntry } from './AuditTimelineEntry';

interface ConversationViewProps {
  ticketId?: number;
}

export const ConversationView = async ({ ticketId }: ConversationViewProps) => {
  // Hardcoded tenant fetch until Auth is implemented
  const firstTenant = await prisma.tenant.findFirst();
  const currentTenantId = firstTenant?.id || '';

  const activeTicket = await prisma.ticket.findFirst({
    where: { 
      ...(ticketId ? { id: ticketId } : {}),
      tenantId: currentTenantId 
    },
    orderBy: { createdAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });

  if (!activeTicket) {
    return (
      <main className="flex-1 overflow-hidden bg-surface-container-lowest dark:bg-[#1a1f24] h-full flex flex-col items-center justify-center text-on-surface-variant">
         <p>No active tickets found.</p>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-hidden bg-surface-container-lowest dark:bg-[#1a1f24] min-h-0 h-full flex flex-col">
      <div className="h-16 flex items-center justify-between px-8 bg-white/80 dark:bg-[#1a1f24]/80 backdrop-blur-md z-40 border-b border-surface-container dark:border-white/5 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-on-background dark:text-white">#{activeTicket.id.toString().padStart(4, '0')} {activeTicket.subject}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-on-surface-variant">
            <p>Type: {activeTicket.itilType}</p>
            <span className="w-1 h-1 rounded-full bg-surface-container-highest"></span>
            <p>Priority: {activeTicket.priority}</p>
            <span className="w-1 h-1 rounded-full bg-surface-container-highest"></span>
            <p>Status: {activeTicket.status}</p>
          </div>
        </div>

        {/* 0.5.3 Status Toggle Buttons + SLA Countdown */}
        <div className="flex items-center gap-6">
          <SLACountdown deadline={new Date(new Date().getTime() + 105 * 60 * 1000)} />
          <StatusActions ticketId={activeTicket.id} currentStatus={activeTicket.status} />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-0">
        {/* Render Original Ticket Description as First Customer Message */}
        <ChatBubble 
          body={activeTicket.description || ""} 
          variant="customer" 
          authorName={activeTicket.requesterId}
          timestamp="Original Issue"
        />

        <AuditTimelineEntry 
          label={`Ticket created via ${activeTicket.itilType}`} 
          icon={CircleDashed} 
          timestamp="Today, 10:45"
        />

        <AuditTimelineEntry 
          label="Assigned to IT-Support Team" 
          icon={UserCheck} 
          timestamp="Today, 10:46"
        />

        {activeTicket.messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            body={msg.body}
            variant={msg.isInternal ? 'internal' : 'agent'}
            authorName={msg.isInternal ? 'Internal Note' : 'Agent'}
            timestamp={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          />
        ))}
      </div>

      <ReplyBox ticketId={activeTicket.id} />
    </main>
  );
};
