import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { ChatBubble } from './ChatBubble';
import { ReplyBox } from './ReplyBox';
import { StatusActions } from './StatusActions';
import { AuditTimelineEntry } from './AuditTimelineEntry';
import { VelaLogo } from '@/components/ui/VelaLogo';

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
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest relative overflow-hidden transition-all duration-700">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,170,170,0.03)_0%,transparent_70%)] animate-pulse" />
        <div className="z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-surface-container-low flex items-center justify-center mb-8 shadow-xl shadow-primary/5 border border-outline-variant/10">
            <span className="material-symbols-outlined text-4xl text-outline-variant animate-bounce-subtle">confirmation_number</span>
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface mb-2">No Ticket Selected</h2>
          <p className="text-on-surface-variant text-sm max-w-xs text-center opacity-70 leading-relaxed">
            Select a conversation from the queue to start assisting your customers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-surface-container-lowest z-30 shadow-[-20px_0_40px_rgba(23,28,31,0.02)] transition-all duration-300">
      {/* Absolute Header with Glassmorphism */}
      <header className="absolute top-0 left-0 right-0 z-20 h-20 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between px-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-5 translate-y-px">
        <VelaLogo size="small" />
        <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant/10 shadow-sm group hover:border-primary/20 transition-colors">
          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">confirmation_number</span>
        </div>
        
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="text-primary-fixed tracking-tight font-headline">INC-{activeTicket.id.toString().padStart(4, '0')}</span>
            <span className="text-outline/40">•</span>
            <span className="truncate max-w-[300px] xl:max-w-[500px]">{activeTicket.subject}</span>
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-primary-container/20 text-on-primary-fixed uppercase tracking-wider">{activeTicket.status}</span>
            <span className="w-1 h-1 rounded-full bg-outline/20"></span>
            <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider">{activeTicket.priority}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <StatusActions ticketId={activeTicket.id} currentStatus={activeTicket.status} />
        <div className="w-px h-6 bg-outline-variant/20 mx-2" />
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-outline hover:bg-surface-variant hover:text-on-surface transition-all active:scale-95 border border-transparent hover:border-outline-variant/20">
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>
    </header>
      
      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto pt-24 pb-8 px-8 space-y-8 custom-scrollbar">
        {/* Render Original Ticket Description as First Customer Message */}
        <ChatBubble 
          body={activeTicket.description || ""} 
          variant="customer" 
          authorName="User"
          timestamp="Today, 10:42 AM"
        />

        <AuditTimelineEntry 
          label={`Ticket created via Portal`} 
          timestamp="Today, 10:45 AM"
        />

        {activeTicket.messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            body={msg.body}
            variant={msg.isInternal ? 'internal' : 'agent'}
            authorName={msg.isInternal ? 'System Analysis' : 'Support Agent'}
            timestamp={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          />
        ))}
      </div>

      {/* Message Composer */}
      <ReplyBox ticketId={activeTicket.id} />
    </div>
  );
};
