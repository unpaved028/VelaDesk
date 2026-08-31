import Link from 'next/link';

export interface PortalTicketItem {
  id: number;
  subject: string;
  status: string;
  requesterId: string;
  workspaceName: string;
  createdAt: Date;
}

interface PortalTicketListProps {
  tickets: PortalTicketItem[];
  showRequester?: boolean;
}

export const PortalTicketList = ({ tickets, showRequester = false }: PortalTicketListProps) => {
  if (tickets.length === 0) {
    return <p className="text-sm text-on-surface-variant">Keine Tickets vorhanden.</p>;
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/portal/tickets/${ticket.id}`}
          className="block p-5 rounded-2xl bg-white dark:bg-white/5 border border-surface-container dark:border-white/5 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">
              #{ticket.id} · {ticket.workspaceName}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">{ticket.status}</span>
          </div>
          <h2 className="text-sm font-bold text-on-background dark:text-white mt-2">{ticket.subject}</h2>
          {showRequester ? (
            <p className="text-[11px] text-on-surface-variant mt-1">{ticket.requesterId}</p>
          ) : null}
        </Link>
      ))}
    </div>
  );
};
