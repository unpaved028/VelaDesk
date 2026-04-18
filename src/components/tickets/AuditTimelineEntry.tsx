import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AuditTimelineEntryProps {
  label: string;
  icon?: LucideIcon;
  timestamp?: string;
}

/**
 * AuditTimelineEntry
 * Eine dezente Komponente zur Darstellung von Systemereignissen im Ticket-Verlauf.
 * (z.B. Status-Updates, Prioritätsänderungen oder Zuweisungen).
 */
export const AuditTimelineEntry = ({ label, icon: Icon, timestamp }: AuditTimelineEntryProps) => {
  return (
    <div className="flex items-center justify-center gap-4 py-4 group">
      {/* Linke Trennlinie */}
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-surface-container-highest/30 dark:to-white/5"></div>
      
      {/* Inhalt */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-surface-container dark:border-white/5 bg-surface-container-lowest/50 dark:bg-white/5 backdrop-blur-sm shadow-sm">
        {Icon && <Icon className="w-3.5 h-3.5 text-on-surface-variant dark:text-on-surface/60" />}
        <span className="text-[10px] sm:text-[11px] font-bold text-on-surface-variant dark:text-on-surface/70 uppercase tracking-wider leading-none">
          {label}
        </span>
        {timestamp && (
          <span className="text-[10px] font-medium text-on-surface-variant/40 dark:text-on-surface/30 tabular-nums">
            {timestamp}
          </span>
        )}
      </div>

      {/* Rechte Trennlinie */}
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-surface-container-highest/30 dark:to-white/5"></div>
    </div>
  );
};
