'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { AlertCircle, ShoppingCart } from 'lucide-react';
import { SLACountdown } from './SLACountdown';

interface TicketQueueItemProps {
  id: string;
  subject: string;
  status: string;
  requesterName: string;
  priority?: string;
  itilType?: 'INCIDENT' | 'SERVICE_REQUEST' | 'PROBLEM' | 'CHANGE';
  isDefault?: boolean;
  slaDeadline?: Date;
}

export const TicketQueueItem = ({ 
  id, 
  subject, 
  status, 
  requesterName, 
  priority,
  itilType,
  isDefault = false,
  slaDeadline
}: TicketQueueItemProps) => {
  const params = useParams();
  const activeId = params.id as string;
  const isActive = activeId === id || (!activeId && isDefault);
  
  const isUrgent = priority?.toLowerCase() === 'urgent' || priority?.toLowerCase() === 'high';

  // Mock deadline if not provided (e.g. now + 45 minutes)
  const deadline = slaDeadline || new Date(new Date().getTime() + 45 * 60 * 1000);

  // ITIL Badge Configuration
  const ItilBadge = () => {
    if (itilType === 'INCIDENT') {
      return (
        <div className="flex items-center gap-1 text-[9px] font-bold text-error dark:text-red-400 bg-error-container/10 dark:bg-red-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
          <AlertCircle className="w-2.5 h-2.5" />
          <span>Incident</span>
        </div>
      );
    }
    if (itilType === 'SERVICE_REQUEST') {
      return (
        <div className="flex items-center gap-1 text-[9px] font-bold text-primary dark:text-blue-400 bg-primary/10 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
          <ShoppingCart className="w-2.5 h-2.5" />
          <span>Request</span>
        </div>
      );
    }
    return null;
  };

  const content = (
    <>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-on-surface-variant tracking-tighter uppercase opacity-70">#TK-{id.padStart(4, '0')}</span>
          <ItilBadge />
        </div>
        {isUrgent ? (
          <span className="text-[10px] px-2 py-0.5 bg-red-100 dark:bg-error-container/20 text-red-600 dark:text-error font-bold rounded-full uppercase tracking-wider shadow-sm dark:shadow-none">Urgent</span>
        ) : (
          <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full uppercase tracking-wider shadow-sm dark:shadow-none ${
            status === 'OPEN' ? 'bg-blue-100 dark:bg-tertiary/20 text-blue-600 dark:text-tertiary' :
            status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500' :
            'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500'
          }`}>
            {status}
          </span>
        )}
      </div>
      <h3 className={`text-sm font-bold leading-snug mb-2 group-hover:translate-x-0.5 transition-transform ${isActive ? 'text-on-background dark:text-white' : 'text-on-surface/80 dark:text-on-surface/80 dark:group-hover:text-white'}`}>{subject}</h3>
      <div className="text-[11px] text-on-surface-variant font-medium flex justify-between items-center group-hover:text-on-surface-variant transition-colors">
        <span className={isActive ? 'opacity-80' : 'opacity-60'}>{requesterName}</span>
        <SLACountdown deadline={deadline} compact />
      </div>
    </>
  );

  return (
    <Link 
      href={`/tickets/${id}`} 
      className={`block p-4 rounded-xl transition-all mb-1 group border border-transparent ${
        isActive 
          ? 'bg-surface-container-lowest dark:bg-white/5 shadow-sm dark:shadow-none border-l-4 border-tertiary hover:bg-surface-bright dark:hover:bg-white/10' 
          : 'cursor-pointer hover:bg-surface-bright dark:hover:bg-white/5 hover:border-surface-container dark:hover:border-white/5'
      }`}
    >
      {content}
    </Link>
  );
};

