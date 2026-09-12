'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ShoppingCart, Clock, CheckCircle2 } from 'lucide-react';

interface KanbanCardProps {
  id: string;
  subject: string;
  requester: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  itilType: 'INCIDENT' | 'SERVICE_REQUEST';
}

const KanbanCard = ({ id, subject, requester, priority, itilType }: KanbanCardProps) => {
  const isUrgent = priority === 'URGENT' || priority === 'HIGH';

  return (
    <Link
      href={`/tickets/${id}`}
      className="mb-3 block rounded-xl border border-transparent bg-white p-4 shadow-sm transition-all hover:border-slate-200 dark:bg-white/5 dark:hover:border-white/10"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-on-surface-variant opacity-60">INC-{id.padStart(4, '0')}</span>
          {itilType === 'INCIDENT' ? (
            <AlertCircle className="w-3 h-3 text-error dark:text-red-400" />
          ) : (
            <ShoppingCart className="w-3 h-3 text-primary dark:text-blue-400" />
          )}
        </div>
        {isUrgent && (
          <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
        )}
      </div>
      
      <h4 className="text-xs font-bold text-on-background dark:text-white leading-snug mb-3 group-hover:text-primary dark:group-hover:text-tertiary transition-colors">
        {subject}
      </h4>
      
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50 dark:border-white/5">
        <span className="max-w-[140px] truncate text-[10px] font-medium text-on-surface-variant opacity-70">
          {requester}
        </span>
      </div>
    </Link>
  );
};

interface ColumnProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  colorClass: string;
}

const KanbanColumn = ({ title, count, icon, children, colorClass }: ColumnProps) => {
  return (
    <div className="flex flex-col w-72 h-full shrink-0">
      <div className="flex items-center justify-between px-4 py-3 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colorClass}`} />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant opacity-80">{title}</h3>
          <span className="bg-slate-100 dark:bg-white/5 text-[10px] px-2 py-0.5 rounded-full font-bold text-on-surface-variant">
            {count}
          </span>
        </div>
        <div className="text-on-surface-variant/40">
          {icon}
        </div>
      </div>
      
      <div className="custom-scrollbar flex-1 overflow-y-auto px-2 pb-10">
        {children}
      </div>
    </div>
  );
};

export interface KanbanTicket {
  id: string;
  subject: string;
  requester: string;
  priority: KanbanCardProps['priority'];
  itilType: KanbanCardProps['itilType'];
  status: 'NEW' | 'OPEN' | 'PENDING' | 'RESOLVED';
}

export const KanbanBoard = ({ tickets }: { tickets: KanbanTicket[] }) => {
  const getTicketsByStatus = (status: KanbanTicket['status']) => tickets.filter((ticket) => ticket.status === status);

  return (
    <div className="flex h-full p-4 gap-4 items-start bg-slate-50/50 dark:bg-transparent">
      <KanbanColumn 
        title="New" 
        count={getTicketsByStatus('NEW').length} 
        colorClass="bg-blue-500"
        icon={<Clock className="w-3.5 h-3.5" />}
      >
        {getTicketsByStatus('NEW').map(({ id, subject, requester, priority, itilType }) => (
          <KanbanCard key={id} id={id} subject={subject} requester={requester} priority={priority} itilType={itilType} />
        ))}
      </KanbanColumn>

      <KanbanColumn 
        title="Open" 
        count={getTicketsByStatus('OPEN').length} 
        colorClass="bg-amber-500"
        icon={<AlertCircle className="w-3.5 h-3.5" />}
      >
        {getTicketsByStatus('OPEN').map(({ id, subject, requester, priority, itilType }) => (
          <KanbanCard key={id} id={id} subject={subject} requester={requester} priority={priority} itilType={itilType} />
        ))}
      </KanbanColumn>

      <KanbanColumn 
        title="Pending" 
        count={getTicketsByStatus('PENDING').length} 
        colorClass="bg-purple-500"
        icon={<Clock className="w-3.5 h-3.5" />}
      >
        {getTicketsByStatus('PENDING').map(({ id, subject, requester, priority, itilType }) => (
          <KanbanCard key={id} id={id} subject={subject} requester={requester} priority={priority} itilType={itilType} />
        ))}
      </KanbanColumn>

      <KanbanColumn 
        title="Resolved" 
        count={getTicketsByStatus('RESOLVED').length} 
        colorClass="bg-emerald-500"
        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
      >
        {getTicketsByStatus('RESOLVED').map(({ id, subject, requester, priority, itilType }) => (
          <KanbanCard key={id} id={id} subject={subject} requester={requester} priority={priority} itilType={itilType} />
        ))}
      </KanbanColumn>
    </div>
  );
};
