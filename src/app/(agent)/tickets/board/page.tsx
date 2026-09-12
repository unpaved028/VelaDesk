import { prisma } from '@/lib/db/prisma';
import { requireAgentContext } from '@/lib/auth/session';
import { KanbanBoard, type KanbanTicket } from '@/components/tickets/KanbanBoard';

export const dynamic = 'force-dynamic';

export default async function KanbanPage() {
  const auth = await requireAgentContext();
  const tickets: KanbanTicket[] = [];

  if (auth.ok) {
    const rows = await prisma.ticket.findMany({
      where: { tenantId: auth.ctx.tenantId },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        itilType: true,
        requesterId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const requesterIds = [...new Set(rows.map((row) => row.requesterId))];
    const [users, customers] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId: auth.ctx.tenantId, id: { in: requesterIds } },
        select: { id: true, name: true, email: true },
      }),
      prisma.customer.findMany({
        where: { tenantId: auth.ctx.tenantId, id: { in: requesterIds } },
        select: { id: true, name: true, email: true },
      }),
    ]);
    const names = new Map<string, string>();
    for (const user of users) names.set(user.id, user.name || user.email);
    for (const customer of customers) names.set(customer.id, customer.name || customer.email);

    for (const row of rows) {
      tickets.push({
        id: String(row.id),
        subject: row.subject,
        requester: names.get(row.requesterId) || row.requesterId,
        priority: row.priority,
        itilType: row.itilType === 'SERVICE_REQUEST' ? 'SERVICE_REQUEST' : 'INCIDENT',
        status: row.status === 'CLOSED' || row.status === 'RESOLVED' ? 'RESOLVED' : row.status === 'PENDING' ? 'PENDING' : row.status === 'NEW' ? 'NEW' : 'OPEN',
      });
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-surface-container-lowest">
      <header className="z-40 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant/15 bg-surface-container-lowest/80 px-8 backdrop-blur-md">
        <div>
          <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface">Kanban Board</h1>
          <p className="text-[10px] font-medium text-on-surface-variant">Tickets for this tenant</p>
        </div>
      </header>

      <main className="custom-scrollbar flex-1 overflow-x-auto overflow-y-hidden">
        {tickets.length === 0 ? (
          <p className="px-8 py-10 text-sm text-on-surface-variant">No tickets in this tenant yet.</p>
        ) : (
          <KanbanBoard tickets={tickets} />
        )}
      </main>
    </div>
  );
}
