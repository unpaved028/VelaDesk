import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getPortalSession } from '@/lib/services/getPortalSession';
import { portalTicketWhere } from '@/lib/portal/ticketScope';
import { PortalTicketList } from '@/components/portal/PortalTicketList';

export const dynamic = 'force-dynamic';

export default async function PortalHomePage() {
  const { authenticated, session } = await getPortalSession();
  if (!authenticated || !session) redirect('/login');

  const tickets = await prisma.ticket.findMany({
    where: portalTicketWhere(session),
    orderBy: { createdAt: 'desc' },
    include: { workspace: { select: { name: true } } },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Meine Tickets</h1>
        <p className="text-sm text-on-surface-variant mt-1">Nur Vorgänge, die Sie selbst eröffnet haben.</p>
      </header>
      <PortalTicketList
        tickets={tickets.map((ticket) => ({
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          requesterId: ticket.requesterId,
          workspaceName: ticket.workspace.name,
          createdAt: ticket.createdAt,
        }))}
      />
    </div>
  );
}
