'use client';

import React, { useState, useEffect } from 'react';

interface SLACountdownProps {
  targetDate: Date;
  compact?: boolean;
}

export const SLACountdown = ({ targetDate, compact = false }: SLACountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      setTimeLeft(difference);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const isOverdue = timeLeft <= 0;
  const absTimeLeft = Math.abs(timeLeft);
  
  const hours = Math.floor(absTimeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((absTimeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((absTimeLeft / 1000) % 60);

  // Styling based on time remaining (Aero-Luxe)
  let statusColor = "text-primary-fixed";
  let pulseClass = "";

  if (isOverdue) {
    statusColor = "text-error font-bold";
    pulseClass = "animate-pulse";
  } else if (hours === 0 && minutes < 30) {
    statusColor = "text-amber-400 font-bold";
    pulseClass = "animate-pulse";
  }

  const formatTime = () => {
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${statusColor} ${pulseClass}`}>
        <span className="material-symbols-outlined text-[14px]">schedule</span>
        <span className="text-[10px] font-bold tabular-nums">
          {isOverdue ? `-${formatTime()}` : formatTime()}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-highest/50 border border-outline-variant/10 ${statusColor} ${pulseClass}`}>
      <span className="material-symbols-outlined text-[18px]">
        {isOverdue ? 'warning' : 'hourglass_top'}
      </span>
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-widest leading-none opacity-70">
          {isOverdue ? 'Overdue' : 'SLA Target'}
        </span>
        <span className="text-xs font-bold tabular-nums leading-tight">
          {isOverdue ? `-${formatTime()}` : formatTime()}
        </span>
      </div>
    </div>
  );
};
