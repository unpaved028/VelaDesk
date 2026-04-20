'use client';

import React from 'react';
import { prisma } from '@/lib/db/prisma';

interface ContextPanelProps {
  ticketId?: number;
}

// 0.5.x: Context Panel (The 4th Column)
// Based on SOP 03.3 Architecture
export const ContextPanel = ({ ticketId }: ContextPanelProps) => {
  // Mock data for initial fly-through, in real world this would be fetched
  const requesterName = 'Sarah Jenkins';
  const requesterTitle = 'Senior Product Manager';
  const company = 'LuxeLabs Integration';

  return (
    <aside className="w-[320px] bg-surface-container-low flex flex-col shrink-0 border-l border-outline-variant/15 z-20 overflow-y-auto custom-scrollbar shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
      {/* 1. Requester Header */}
      <div className="p-6 border-b border-outline-variant/10">
        <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-6">Requester Insights</h3>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-container to-primary-fixed shadow-xl shadow-primary/10 flex items-center justify-center mb-4 relative group">
            <span className="text-3xl font-headline font-bold text-on-primary-container group-hover:scale-110 transition-transform">{requesterName.charAt(0)}</span>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface-container-lowest border-2 border-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
            </div>
          </div>
          <h4 className="font-headline font-bold text-on-surface text-lg leading-tight">{requesterName}</h4>
          <p className="text-xs text-on-surface-variant font-medium mt-1">{requesterTitle}</p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">Company</p>
              <p className="text-xs font-bold text-on-surface">{company}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">alternate_email</span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">Email</p>
              <p className="text-xs font-bold text-on-surface">s.jenkins@luxelabs.io</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SLA Overview */}
      <div className="p-6 border-b border-outline-variant/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest">SLA Performance</h3>
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase">Service Gold</span>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-[11px] font-bold mb-2">
              <span className="text-on-surface">First Response</span>
              <span className="text-primary tracking-tighter">04:12 Remaining</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary-fixed w-[75%] rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-bold mb-2">
              <span className="text-on-surface">Resolution</span>
              <span className="text-outline/60 tracking-tighter">Due in 24h</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-outline-variant w-[20%] rounded-full opacity-40"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Linked Assets */}
      <div className="p-6">
        <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-6">Hardware Workspace</h3>
        
        <div className="space-y-3">
          <div className="p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-xl hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                <span className="material-symbols-outlined text-outline group-hover:text-primary">laptop_mac</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-on-surface">MBP 16" - M3 Max</p>
                <p className="text-[10px] text-outline mt-0.5 tracking-tighter">SN: VEL-992121-PRO</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-xl hover:shadow-lg transition-all cursor-pointer group opacity-60 grayscale hover:opacity-100 hover:grayscale-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-outline">dock</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-on-surface">Studio Display</p>
                <p className="text-[10px] text-outline mt-0.5 tracking-tighter">SN: VEL-8811-EXT</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-auto p-6 bg-surface-container-high/30">
        <button className="w-full py-3 px-4 rounded-xl border border-primary-fixed/20 bg-primary-container/20 text-on-primary-fixed text-xs font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">history</span>
          User Activity Audit
        </button>
      </div>
    </aside>
  );
};
