import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { TicketQueueItem } from './TicketQueueItem';

export const TicketQueue = async () => {
  // Hardcoded tenant fetch until Auth is implemented
  const firstTenant = await prisma.tenant.findFirst();
  const currentTenantId = firstTenant?.id || '';

  const tickets = await prisma.ticket.findMany({
    where: { tenantId: currentTenantId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <section className="w-[320px] lg:w-[360px] bg-surface-container-low flex flex-col shrink-0 z-20 border-r border-outline-variant/15 group/queue">
      {/* Queue Header */}
      <div className="h-16 flex items-center px-6 border-b border-outline-variant/15 bg-surface-container-low/50 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="font-headline font-bold text-on-surface text-lg tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-fixed">filter_list</span>
          All Tickets
        </h2>
        <div className="ml-auto flex items-center bg-surface-container rounded-full px-2 py-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-widest">{tickets.length}</span>
        </div>
      </div>

      {/* Queue Search / Filter bar (Stub) */}
      <div className="px-4 py-2 border-b border-outline-variant/10">
        <div className="bg-surface-container-highest rounded-lg px-3 py-1.5 flex items-center gap-2 hover:bg-surface-container-high focus-within:bg-surface-container-lowest transition-all duration-300">
          <span className="material-symbols-outlined text-[18px] text-outline">search</span>
          <input 
            type="text" 
            placeholder="Search tickets..." 
            className="bg-transparent border-none text-xs text-on-surface focus:ring-0 w-full outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {tickets.map((ticket, index) => {
          // Generate mock SLA targets: 
          // 0: Overdue, 1: Soon (<30m), Others: Far out (+2h, +5h etc)
          const slaTarget = new Date();
          if (index === 0) slaTarget.setMinutes(slaTarget.getMinutes() - 15); // Overdue
          else if (index === 1) slaTarget.setMinutes(slaTarget.getMinutes() + 25); // Soon
          else slaTarget.setHours(slaTarget.getHours() + (index * 2)); // Far out

          return (
            <TicketQueueItem
              key={ticket.id}
              id={ticket.id.toString()}
              ticketId={`INC-${1000 + index}`} 
              subject={ticket.subject}
              snippet={ticket.description?.substring(0, 80)}
              status={ticket.status}
              priority={(ticket.priority as any) || 'Medium'}
              isDefault={index === 0}
              slaTarget={slaTarget}
            />
          );
        })}
        
        {tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 opacity-30">
            <span className="material-symbols-outlined text-[48px]">inbox</span>
            <span className="text-xs font-bold uppercase tracking-widest mt-2">Empty Queue</span>
          </div>
        )}
      </div>
    </section>
  );
};
