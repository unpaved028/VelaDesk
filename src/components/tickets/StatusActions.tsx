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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          currentStatus === 'PENDING'
            ? 'bg-[#fffde7] text-[#fbc02d] dark:bg-tertiary/20 dark:text-tertiary opacity-70 cursor-not-allowed'
            : 'bg-surface-container hover:bg-surface-container-high text-on-surface dark:bg-white/5 dark:hover:bg-white/10 dark:text-white'
        }`}
      >
        <Clock className="w-4 h-4" />
        Pending
      </button>
      <button
        onClick={() => handleStatusChange('RESOLVED')}
        disabled={currentStatus === 'RESOLVED'}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          currentStatus === 'RESOLVED'
            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 opacity-70 cursor-not-allowed'
            : 'bg-surface-container hover:bg-surface-container-high text-on-surface dark:bg-white/5 dark:hover:bg-white/10 dark:text-white'
        }`}
      >
        <CheckCircle className="w-4 h-4" />
        Close Ticket
      </button>
    </div>
  );
};
