'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { searchTicketsForLinking, linkTickets } from '@/app/actions/ticketLinkActions';
import type { TicketReference } from '@/types/ticketLink';

interface RelatedTicketsModalProps {
  ticketId: number;
  isOpen: boolean;
  onClose: () => void;
  onLinked: () => void;
}

const ITIL_ICONS: Record<string, string> = {
  INCIDENT: 'warning',
  SERVICE_REQUEST: 'shopping_cart',
  PROBLEM: 'bug_report',
  CHANGE: 'swap_horiz',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-surface-container-high text-on-surface-variant',
  MEDIUM: 'bg-primary-container/30 text-on-primary-container',
  HIGH: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  URGENT: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

/**
 * Modal for searching and linking tickets in parent-child relationships.
 * 
 * Agent can choose the relationship direction (current ticket as parent or child).
 * Search supports both ticket ID (numeric) and subject text matching.
 */
export const RelatedTicketsModal = ({ ticketId, isOpen, onClose, onLinked }: RelatedTicketsModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TicketReference[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [linkDirection, setLinkDirection] = useState<'parent' | 'child'>('child');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    const response = await searchTicketsForLinking(ticketId, searchQuery);
    if (response.success && response.data) {
      setResults(response.data.tickets);
    } else {
      setError(response.error || 'Search failed');
      setResults([]);
    }
    setIsSearching(false);
  }, [ticketId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
      setLinkDirection('child');
    }
  }, [isOpen]);

  const handleLink = (targetTicketId: number) => {
    setError(null);
    startTransition(async () => {
      // If direction is 'child', current ticket is parent → target is child
      // If direction is 'parent', target is parent → current ticket is child
      const parentId = linkDirection === 'child' ? ticketId : targetTicketId;
      const childId = linkDirection === 'child' ? targetTicketId : ticketId;

      const response = await linkTickets(parentId, childId);
      if (response.success) {
        onLinked();
        onClose();
      } else {
        setError(response.error || 'Failed to link tickets');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">link</span>
              </div>
              <div>
                <h2 className="font-headline font-bold text-on-surface text-base">Link Related Ticket</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  INC-{ticketId.toString().padStart(4, '0')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-surface-variant hover:text-on-surface transition-all"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Direction Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setLinkDirection('child')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                linkDirection === 'child'
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-sm">subdirectory_arrow_right</span>
              Add as Child
            </button>
            <button
              onClick={() => setLinkDirection('parent')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                linkDirection === 'parent'
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-sm">arrow_upward</span>
              Set as Parent
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ticket ID or subject..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-high text-sm text-on-surface placeholder:text-outline border border-transparent focus:border-primary-fixed/30 focus:bg-surface-container-lowest outline-none transition-all"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {results.length === 0 && query.trim().length >= 2 && !isSearching && !error && (
            <div className="py-12 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-3xl text-outline/40 mb-2">search_off</span>
              <p className="text-sm text-on-surface-variant">No matching tickets found</p>
              <p className="text-xs text-outline mt-1">Try a different ID or keyword</p>
            </div>
          )}

          {results.length === 0 && query.trim().length < 2 && (
            <div className="py-12 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-3xl text-outline/40 mb-2">manage_search</span>
              <p className="text-sm text-on-surface-variant">Type to search tickets</p>
              <p className="text-xs text-outline mt-1">Enter at least 2 characters or a ticket ID</p>
            </div>
          )}

          {results.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => handleLink(ticket.id)}
              disabled={isPending}
              className="w-full px-6 py-4 border-b border-outline-variant/8 hover:bg-surface-variant/30 transition-all text-left flex items-start gap-4 group disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-lg text-outline group-hover:text-primary">
                  {ITIL_ICONS[ticket.itilType] || 'confirmation_number'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-primary-fixed tracking-tight">
                    INC-{ticket.id.toString().padStart(4, '0')}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[ticket.priority] || ''}`}>
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-sm font-medium text-on-surface truncate">{ticket.subject}</p>
                <p className="text-[10px] text-outline mt-0.5 uppercase tracking-wider">{ticket.status} • {ticket.itilType}</p>
              </div>
              <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-primary text-lg">add_link</span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 bg-surface-container-high/30 border-t border-outline-variant/10">
          <p className="text-[10px] text-outline text-center">
            {linkDirection === 'child'
              ? `Selected ticket will become a child of INC-${ticketId.toString().padStart(4, '0')}`
              : `Selected ticket will become the parent of INC-${ticketId.toString().padStart(4, '0')}`
            }
          </p>
        </div>
      </div>
    </div>
  );
};
