'use server';

import { prisma } from '@/lib/db/prisma';
import { getPortalSession } from '@/lib/services/getPortalSession';
import { ensureCustomer } from '@/lib/services/customers';
import { sendTicketAckMail } from '@/lib/services/emailSender';
import { createErrorResponse } from '@/lib/validation/schemas';

export async function createPortalTicket(subject: string, description: string) {
  const { authenticated, session } = await getPortalSession();
  if (!authenticated || !session) return createErrorResponse('Not authenticated.');

  const title = subject.trim();
  const body = description.trim();
  if (!title) return createErrorResponse('Subject is required.');

  const workspace = await prisma.workspace.findFirst({
    where: { tenantId: session.tenantId },
    orderBy: { name: 'asc' },
    select: { id: true },
  });
  if (!workspace) return createErrorResponse('Kein Workspace vorhanden.');

  const requesterId = session.userId || session.email;
  const now = new Date();
  const ticket = await prisma.ticket.create({
    data: {
      tenantId: session.tenantId,
      workspaceId: workspace.id,
      subject: title,
      description: body || title,
      requesterId,
      slaResponseDeadline: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      slaResolutionDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  await ensureCustomer({
    tenantId: session.tenantId,
    email: session.email,
    name: session.name || session.email,
  });
  await sendTicketAckMail({
    ticketId: ticket.id,
    tenantId: session.tenantId,
    workspaceId: workspace.id,
    requesterId,
    subject: ticket.subject,
  });

  return { success: true, data: { id: ticket.id }, error: null };
}
