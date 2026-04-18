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

  // Fetch users to map requesterId to user name (since relation is missing in schema)
  const users = await prisma.user.findMany({
    where: { tenantId: currentTenantId }
  });
  const userMap = new Map(users.map(u => [u.id, u.name]));

  return (
    <aside className="w-80 bg-surface-container-low dark:bg-[#12181b] flex flex-col h-full border-r-0 shrink-0 min-h-0">
      <div className="p-6 border-b border-surface-container dark:border-white/5 font-bold text-on-background dark:text-white bg-transparent tracking-tight text-lg uppercase">
        Queue
      </div>
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {tickets.map((ticket, index) => (
          <TicketQueueItem
            key={ticket.id}
            id={ticket.id.toString()}
            subject={ticket.subject}
            status={ticket.status}
            priority={ticket.priority}
            itilType={index % 2 === 0 ? 'INCIDENT' : 'SERVICE_REQUEST'}
            requesterName={userMap.get(ticket.requesterId) || 'Unknown'}
            isDefault={index === 0}
          />
        ))}
      </div>
    </aside>
  );
};
