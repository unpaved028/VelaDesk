'use client';

import { useState, useEffect, useTransition } from 'react';
import { getRelatedTickets, unlinkTicket } from '@/app/actions/ticketLinkActions';
import { RelatedTicketsModal } from './RelatedTicketsModal';
import type { LinkedTicket } from '@/types/ticketLink';

interface RelatedTicketsSectionProps {
  ticketId: number;
}

const STATUS_DOTS: Record<string, string> = {
  NEW: 'bg-blue-400',
  OPEN: 'bg-emerald-400',
  PENDING: 'bg-amber-400',
  RESOLVED: 'bg-slate-400',
  CLOSED: 'bg-slate-300',
  ESCALATED: 'bg-red-400',
};

/**
 * Displays linked parent/child tickets in the ContextPanel.
 * Provides inline unlink + open link-modal functionality.
 */
export const RelatedTicketsSection = ({ ticketId }: RelatedTicketsSectionProps) => {
  const [related, setRelated] = useState<LinkedTicket[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchRelated = async () => {
    setIsLoading(true);
    const response = await getRelatedTickets(ticketId);
    if (response.success && response.data) {
      setRelated(response.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRelated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleUnlink = (childTicketId: number) => {
    startTransition(async () => {
      const response = await unlinkTicket(childTicketId);
      if (response.success) {
        await fetchRelated();
      }
    });
  };

  const handleLinked = () => {
    fetchRelated();
  };

  const parentRelation = related.find((r) => r.relationship === 'PARENT');
  const childRelations = related.filter((r) => r.relationship === 'CHILD');

  return (
    <>
      <div className="p-6 border-b border-outline-variant/10">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest">Related Tickets</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:bg-primary/10 hover:text-primary transition-all"
            title="Link ticket"
          >
            <span className="material-symbols-outlined text-[16px]">add_link</span>
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && related.length === 0 && (
          <div className="py-4 text-center">
            <span className="material-symbols-outlined text-2xl text-outline/30 mb-1 block">link_off</span>
            <p className="text-xs text-on-surface-variant/60">No linked tickets</p>
          </div>
        )}

        {!isLoading && related.length > 0 && (
          <div className="space-y-2">
            {/* Parent Ticket */}
            {parentRelation && (
              <div className="p-3 bg-surface-container-lowest border border-outline-variant/10 rounded-xl group relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-[14px] text-amber-500">arrow_upward</span>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Parent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOTS[parentRelation.ticket.status] || 'bg-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-primary-fixed tracking-tight">
                      INC-{parentRelation.ticket.id.toString().padStart(4, '0')}
                    </p>
                    <p className="text-xs text-on-surface font-medium truncate">{parentRelation.ticket.subject}</p>
                  </div>
                </div>
                {/* Unlink button — removes current ticket from parent */}
                <button
                  onClick={() => handleUnlink(ticketId)}
                  disabled={isPending}
                  className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-outline/0 group-hover:text-red-500/80 hover:!bg-red-500/10 transition-all disabled:opacity-50"
                  title="Unlink from parent"
                >
                  <span className="material-symbols-outlined text-[14px]">link_off</span>
                </button>
              </div>
            )}

            {/* Children */}
            {childRelations.map((child) => (
              <div
                key={child.ticket.id}
                className="p-3 bg-surface-container-lowest border border-outline-variant/10 rounded-xl group relative"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-[14px] text-primary/60">subdirectory_arrow_right</span>
                  <span className="text-[9px] font-bold text-primary/60 uppercase tracking-wider">Child</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOTS[child.ticket.status] || 'bg-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-primary-fixed tracking-tight">
                      INC-{child.ticket.id.toString().padStart(4, '0')}
                    </p>
                    <p className="text-xs text-on-surface font-medium truncate">{child.ticket.subject}</p>
                  </div>
                </div>
                {/* Unlink child */}
                <button
                  onClick={() => handleUnlink(child.ticket.id)}
                  disabled={isPending}
                  className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-outline/0 group-hover:text-red-500/80 hover:!bg-red-500/10 transition-all disabled:opacity-50"
                  title="Unlink child"
                >
                  <span className="material-symbols-outlined text-[14px]">link_off</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <RelatedTicketsModal
        ticketId={ticketId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLinked={handleLinked}
      />
    </>
  );
};
