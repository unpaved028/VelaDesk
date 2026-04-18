'use client';

import React, { useState, useEffect } from 'react';
import { Timer, AlertCircle, Clock } from 'lucide-react';

interface SLACountdownProps {
  deadline: Date;
  compact?: boolean;
}

export const SLACountdown = ({ deadline, compact = false }: SLACountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = deadline.getTime() - now;
      setTimeLeft(distance);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  const formatTime = (ms: number) => {
    const absMs = Math.abs(ms);
    const hours = Math.floor(absMs / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absMs % (1000 * 60)) / 1000);

    const sign = ms < 0 ? '-' : '';
    
    if (hours > 0) {
      return `${sign}${hours}h ${minutes}m`;
    }
    return `${sign}${minutes}m ${seconds}s`;
  };

  const isExpired = timeLeft < 0;
  const isDanger = timeLeft < 30 * 60 * 1000; // < 30m
  const isWarning = timeLeft < 2 * 60 * 60 * 1000; // < 2h

  // Styles based on urgency
  const getStyles = () => {
    if (isExpired) return "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20";
    if (isDanger) return "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20 animate-pulse";
    if (isWarning) return "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20";
    return "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/5";
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tighter border ${getStyles()} transition-colors duration-500`}>
        {isExpired ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
        <span>{formatTime(timeLeft)}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${getStyles()} transition-colors duration-500 shadow-sm`}>
      <Timer className={`w-3.5 h-3.5 ${isDanger ? 'animate-bounce' : ''}`} />
      <span>{isExpired ? 'SLA BREACHED' : 'SLA'}</span>
      <span className="opacity-40 ml-1">|</span>
      <span className="tabular-nums ml-1">{formatTime(timeLeft)}</span>
    </div>
  );
};
