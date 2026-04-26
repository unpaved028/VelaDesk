'use client';

import React, { useEffect, useState } from 'react';

interface SLACountdownProps {
  label?: string;
  deadline?: Date | string | null;
  targetDate?: Date | string | null; // Support TicketQueueItem naming
  isCompleted?: boolean;
  compact?: boolean;
}

export const SLACountdown = ({
  label,
  deadline,
  targetDate,
  isCompleted = false,
  compact = false
}: SLACountdownProps) => {
  const finalDeadline = deadline || targetDate;
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);

  const setFormattedTime = () => {
    if (isCompleted) {
      setTimeLeft('Met');
      setIsOverdue(false);
    } else {
      setTimeLeft(null);
      setIsOverdue(false);
    }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (compact) {
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    if (!finalDeadline || isCompleted) {
      setFormattedTime();
      return;
    }

    const calculate = () => {
      const now = new Date();
      const target = new Date(finalDeadline);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setIsOverdue(true);
        setTimeLeft(formatDuration(Math.abs(diff)));
      } else {
        setIsOverdue(false);
        setTimeLeft(formatDuration(diff));
      }
    };

    calculate(); // Run immediately
    const timer = setInterval(calculate, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalDeadline, isCompleted]);

  if (!finalDeadline && !isCompleted) return null;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${isCompleted
        ? 'bg-primary/10 text-primary-fixed'
        : isOverdue
          ? 'bg-error/10 text-error animate-pulse'
          : 'bg-surface-container-highest text-on-surface'
        }`}>
        <span className="material-symbols-outlined text-[14px]">
          {isCompleted ? 'check_circle' : isOverdue ? 'timer_off' : 'schedule'}
        </span>
        {isCompleted ? 'Met' : timeLeft}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 mb-4 p-3 rounded-lg bg-surface-container-high border border-outline-variant/10">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-outline">
        <span>{label}</span>
        {isCompleted && (
          <span className="flex items-center gap-1 text-primary-fixed">
            <span className="material-symbols-outlined text-[12px] font-bold">check_circle</span>
            Met
          </span>
        )}
      </div>

      {!isCompleted && (
        <div className={`text-sm font-bold flex items-center gap-2 ${isOverdue ? 'text-error' : 'text-on-surface'}`}>
          <span className="material-symbols-outlined text-[18px]">
            {isOverdue ? 'timer_off' : 'schedule'}
          </span>
          {timeLeft}
          {isOverdue && <span className="text-[10px] uppercase font-bold text-error/80 px-1.5 py-0.5 rounded bg-error/10">Overdue</span>}
        </div>
      )}
    </div>
  );
};
