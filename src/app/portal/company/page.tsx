import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getPortalSession } from '@/lib/services/getPortalSession';
import { portalTicketWhere } from '@/lib/portal/ticketScope';
import { PortalTicketList } from '@/components/portal/PortalTicketList';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import { getTenantFacing } from '@/lib/services/tenantFacing';
import { portalCopy } from '@/lib/i18n/customerFacing';

export const dynamic = 'force-dynamic';

export default async function CompanyTicketsPage() {
  const { authenticated, session } = await getPortalSession();
  if (!authenticated || !session) redirect('/login');
  if (!session.isCustomerAdmin) redirect('/portal');
  const copy = portalCopy((await getTenantFacing(session.tenantId)).locale);

  const tickets = await prisma.ticket.findMany({
    where: portalTicketWhere(session),
    orderBy: { createdAt: 'desc' },
    include: { workspace: { select: { name: true } } },
  });

  return (
    <div className="space-y-8">
      <PortalPageHeader
        title={copy.companyTitle}
        description={copy.companyDescription}
      />
      <PortalTicketList
        showRequester
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
