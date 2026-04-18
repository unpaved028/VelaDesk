'use client';

import React from 'react';
import { AlertCircle, ShoppingCart, Clock, CheckCircle2, MoreHorizontal } from 'lucide-react';

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
    <div className="bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all cursor-grab active:cursor-grabbing group mb-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-on-surface-variant opacity-60">#TK-{id}</span>
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
        <span className="text-[10px] text-on-surface-variant opacity-70 font-medium truncate max-w-[100px]">
          {requester}
        </span>
        <button className="text-on-surface-variant opacity-40 hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
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
      
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar pb-10">
        {children}
        <button className="w-full py-3 rounded-xl border border-dashed border-slate-200 dark:border-white/5 text-[10px] font-bold text-on-surface-variant/40 hover:text-on-surface-variant/100 hover:border-slate-300 dark:hover:border-white/20 transition-all uppercase tracking-tighter">
          + Add Ticket
        </button>
      </div>
    </div>
  );
};

export const KanbanBoard = () => {
  // Mock Data
  const mockTickets = [
    { id: '8821', subject: 'Laptop Display flackert', requester: 'Max Mustermann', priority: 'URGENT', itilType: 'INCIDENT', status: 'NEW' },
    { id: '8822', subject: 'VPN Login funktioniert nicht', requester: 'Julia Jäger', priority: 'HIGH', itilType: 'INCIDENT', status: 'OPEN' },
    { id: '8823', subject: 'Neues MacBook M3 anfordern', requester: 'Rene Jung', priority: 'MEDIUM', itilType: 'SERVICE_REQUEST', status: 'PENDING' },
    { id: '8824', subject: 'Adobe CC Lizenz verlängern', requester: 'Sarah Schmidt', priority: 'LOW', itilType: 'SERVICE_REQUEST', status: 'NEW' },
    { id: '8825', subject: 'Remote Office Setup', requester: 'Tom Teufel', priority: 'MEDIUM', itilType: 'SERVICE_REQUEST', status: 'RESOLVED' },
    { id: '8826', subject: 'Drucker im 3. OG staut', requester: 'Ute Uhu', priority: 'HIGH', itilType: 'INCIDENT', status: 'OPEN' },
  ];

  const getTicketsByStatus = (status: string) => mockTickets.filter(t => t.status === status);

  return (
    <div className="flex h-full p-4 gap-4 items-start bg-slate-50/50 dark:bg-transparent">
      <KanbanColumn 
        title="New" 
        count={getTicketsByStatus('NEW').length} 
        colorClass="bg-blue-500"
        icon={<Clock className="w-3.5 h-3.5" />}
      >
        {getTicketsByStatus('NEW').map(t => <KanbanCard key={t.id} {...t as any} />)}
      </KanbanColumn>

      <KanbanColumn 
        title="Open" 
        count={getTicketsByStatus('OPEN').length} 
        colorClass="bg-amber-500"
        icon={<AlertCircle className="w-3.5 h-3.5" />}
      >
        {getTicketsByStatus('OPEN').map(t => <KanbanCard key={t.id} {...t as any} />)}
      </KanbanColumn>

      <KanbanColumn 
        title="Pending" 
        count={getTicketsByStatus('PENDING').length} 
        colorClass="bg-purple-500"
        icon={<Clock className="w-3.5 h-3.5" />}
      >
        {getTicketsByStatus('PENDING').map(t => <KanbanCard key={t.id} {...t as any} />)}
      </KanbanColumn>

      <KanbanColumn 
        title="Resolved" 
        count={getTicketsByStatus('RESOLVED').length} 
        colorClass="bg-emerald-500"
        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
      >
        {getTicketsByStatus('RESOLVED').map(t => <KanbanCard key={t.id} {...t as any} />)}
      </KanbanColumn>
    </div>
  );
};
