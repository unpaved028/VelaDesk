'use client';

import { SLACountdown } from './SLACountdown';
import { RelatedTicketsSection } from './RelatedTicketsSection';
import { TimeTracker } from './TimeTracker';
import { TicketAssetLinker } from './TicketAssetLinker';

export interface ContextPanelRequester {
  name: string;
  email: string;
  company: string | null;
}

export interface ContextPanelAsset {
  id: string;
  name: string;
  type: string;
  serialNumber: string | null;
  warrantyExpires: string | null;
}

interface ContextPanelProps {
  ticketId?: number;
  requester?: ContextPanelRequester | null;
  slaPolicyName?: string | null;
  slaResponseDeadline?: Date | string | null;
  slaResolutionDeadline?: Date | string | null;
  firstResponseAt?: Date | string | null;
  resolvedAt?: Date | string | null;
  assets?: ContextPanelAsset[];
}

export const ContextPanel = ({
  ticketId,
  requester,
  slaPolicyName,
  slaResponseDeadline,
  slaResolutionDeadline,
  firstResponseAt,
  resolvedAt,
  assets = [],
}: ContextPanelProps) => {
  const requesterName = requester?.name ?? null;
  const initial = requesterName ? requesterName.charAt(0).toUpperCase() : '?';

  return (
    <aside className="w-[320px] bg-surface-container-low flex flex-col shrink-0 border-l border-outline-variant/15 z-20 overflow-y-auto custom-scrollbar shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
      <div className="p-6 border-b border-outline-variant/10">
        <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-6">Requester Insights</h3>

        {requesterName ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-4 relative group">
              <span className="text-3xl font-headline font-bold text-on-primary-container group-hover:scale-110 transition-transform">{initial}</span>
            </div>
            <h4 className="font-headline font-bold text-on-surface text-lg leading-tight">{requesterName}</h4>
            {requester?.email ? (
              <p className="text-xs text-on-surface-variant font-medium mt-1">{requester.email}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant text-center">No ticket selected</p>
        )}

        {requester ? (
          <div className="mt-8 space-y-4">
            {requester.company ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">Company</p>
                  <p className="text-xs font-bold text-on-surface">{requester.company}</p>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">alternate_email</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">Email</p>
                <p className="text-xs font-bold text-on-surface">{requester.email}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="p-6 border-b border-outline-variant/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest">SLA Performance</h3>
          {slaPolicyName ? (
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter">{slaPolicyName}</span>
          ) : null}
        </div>

        <SLACountdown
          label="First Response"
          deadline={slaResponseDeadline}
          isCompleted={!!firstResponseAt}
        />

        <SLACountdown
          label="Resolution"
          deadline={slaResolutionDeadline}
          isCompleted={!!resolvedAt}
        />
      </div>

      {ticketId ? <TimeTracker ticketId={ticketId} /> : null}

      {ticketId ? <RelatedTicketsSection ticketId={ticketId} /> : null}

      {ticketId ? <TicketAssetLinker ticketId={ticketId} linkedAssets={assets} /> : (
        <div className="p-6">
          <h3 className="mb-6 text-[10px] font-bold uppercase tracking-widest text-outline">Linked Assets</h3>
          <p className="text-xs text-on-surface-variant">No ticket selected.</p>
        </div>
      )}
    </aside>
  );
};
