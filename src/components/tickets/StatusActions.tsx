'use client';

import React from 'react';
import { updateTicketStatus } from '@/app/actions/ticketActions';
import { CheckCircle, Clock } from 'lucide-react';

interface StatusActionsProps {
  ticketId: string | number;
  currentStatus: string;
}

export const StatusActions = ({ ticketId, currentStatus }: StatusActionsProps) => {
  const handleStatusChange = async (status: 'PENDING' | 'RESOLVED') => {
    if (currentStatus === status) return;

    const numericId = typeof ticketId === 'string' ? parseInt(ticketId, 10) : ticketId;
    const res = await updateTicketStatus(numericId, status);
    
    if (!res?.success) {
      console.error('Failed to change status:', res?.error);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleStatusChange('PENDING')}
        disabled={currentStatus === 'PENDING'}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
          currentStatus === 'PENDING'
            ? 'bg-secondary-container text-on-secondary-container shadow-inner opacity-50 cursor-not-allowed'
            : 'bg-surface-container-high hover:bg-secondary hover:text-white text-on-surface hover:shadow-lg hover:shadow-secondary/20 hover:-translate-y-0.5'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">history_toggle_off</span>
        Set Pending
      </button>
      <button
        onClick={() => handleStatusChange('RESOLVED')}
        disabled={currentStatus === 'RESOLVED'}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
          currentStatus === 'RESOLVED'
            ? 'bg-primary-container text-on-primary-container shadow-inner opacity-50 cursor-not-allowed'
            : 'bg-surface-container-high hover:bg-primary-fixed hover:text-on-primary-fixed text-on-surface hover:shadow-lg hover:shadow-primary-fixed/20 hover:-translate-y-0.5'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">task_alt</span>
        Resolve Ticket
      </button>
    </div>
  );
};
