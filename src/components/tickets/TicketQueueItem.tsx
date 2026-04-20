'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SLACountdown } from './SLACountdown';

interface TicketQueueItemProps {
  id: string;
  ticketId: string; // e.g. INC-1042
  subject: string;
  snippet?: string;
  status: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  isDefault?: boolean;
  slaTarget?: Date;
}

export const TicketQueueItem = ({ 
  id, 
  ticketId,
  subject, 
  snippet,
  status, 
  priority,
  isDefault = false,
  slaTarget,
}: TicketQueueItemProps) => {
  const params = useParams();
  const activeId = params.id as string;
  const isActive = activeId === id || (!activeId && isDefault);
  
  const priorityStyles = {
    Critical: "bg-primary-container/20 text-on-primary-fixed",
    High: "bg-error-container/20 text-error",
    Medium: "bg-secondary-container/20 text-secondary",
    Low: "bg-surface-variant/30 text-on-surface-variant"
  };

  const activeClasses = isActive 
    ? "bg-surface-container-lowest dark:bg-surface-container-highest border-l-primary-fixed shadow-md z-10 scale-[1.02] opacity-100" 
    : "border-l-transparent hover:bg-surface-variant/30 dark:bg-surface-container dark:hover:bg-surface-container-high opacity-75 hover:opacity-100 scale-100";

  return (
    <Link 
      href={`/tickets/${id}`} 
      className={`px-5 py-4 border-b border-outline-variant/15 border-l-[3px] cursor-pointer transition-all duration-300 block relative ${activeClasses}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold text-outline dark:text-primary-fixed tracking-widest uppercase opacity-70">
          {ticketId}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityStyles[priority]}`}>
          {priority}
        </span>
      </div>
      
      <h3 className="font-bold text-on-surface dark:text-primary text-sm mb-1 line-clamp-2 leading-tight">
        {subject}
      </h3>
      
      {snippet && (
        <p className="text-xs text-on-surface-variant line-clamp-1 mb-3 opacity-80">
          {snippet}
        </p>
      )}

      <div className="flex justify-between items-center px-0.5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-outline dark:text-outline-variant uppercase tracking-widest">{status}</span>
          {slaTarget && <SLACountdown targetDate={slaTarget} compact />}
        </div>
        <span className="material-symbols-outlined text-[16px] text-outline opacity-40 hover:opacity-100 transition-opacity">more_horiz</span>
      </div>
      
      {isActive && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary-fixed rounded-l-full shadow-[0_0_10px_rgba(0,251,251,0.5)]" />
      )}
    </Link>
  );
};

