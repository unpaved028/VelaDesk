import { prisma } from '@/lib/db/prisma';
import { findActiveMailbox, sendGraphMail, type MailDelivery } from './graphMail';
import { getTenantFacing } from './tenantFacing';
import { renderMail } from './mailTemplates';

export type { MailDelivery };

/**
 * Sends a public reply via Microsoft Graph when a mailbox is configured.
 * Returns the real delivery outcome — never pretends a mock send succeeded.
 */
export async function sendTicketReplyNotification(
  ticketId: number,
  tenantId: string,
  workspaceId: string,
  requesterId: string,
  htmlBody: string
): Promise<MailDelivery> {
  let toEmail = '';
  const user = await prisma.user.findUnique({ where: { id: requesterId } });
  if (user?.email) {
    toEmail = user.email;
  } else {
    const customer = await prisma.customer.findUnique({ where: { id: requesterId } });
    if (customer?.email) {
      toEmail = customer.email;
    } else if (requesterId.includes('@')) {
      toEmail = requesterId;
    }
  }

  if (!toEmail) {
    console.warn(`[emailSender] Could not resolve email address for requesterId: ${requesterId}`);
    return 'no_recipient';
  }

  const mailbox = await findActiveMailbox(tenantId, workspaceId);
  if (!mailbox) {
    console.info(`[emailSender] No mailbox for workspace ${workspaceId}; reply was not emailed.`);
    return 'no_mailbox';
  }

  const facing = await getTenantFacing(tenantId);
  const rendered = await renderMail(tenantId, 'public_reply', facing, {
    brand: facing.brandName,
    ticketId,
  });
  const delivery = await sendGraphMail({
    tenantId,
    mailbox,
    toEmail,
    subject: rendered.subject,
    htmlBody,
  });

  if (delivery === 'sent') {
    console.info(`[emailSender] Sent notification to ${toEmail} for Ticket ${ticketId}`);
  }

  return delivery;
}

export async function sendMagicLinkMail(
  tenantId: string,
  toEmail: string,
  magicLinkUrl: string
): Promise<MailDelivery> {
  const mailbox = await findActiveMailbox(tenantId);
  if (!mailbox) {
    return 'no_mailbox';
  }

  const facing = await getTenantFacing(tenantId);
  const rendered = await renderMail(tenantId, 'magic_link', facing, {
    brand: facing.brandName,
    link: magicLinkUrl,
  });
  return sendGraphMail({
    tenantId,
    mailbox,
    toEmail,
    subject: rendered.subject,
    htmlBody: rendered.body,
  });
}

export async function sendTicketAckMail(input: {
  ticketId: number;
  tenantId: string;
  workspaceId: string;
  requesterId: string;
  subject: string;
}): Promise<MailDelivery> {
  let toEmail = '';
  const user = await prisma.user.findUnique({ where: { id: input.requesterId } });
  if (user?.email) {
    toEmail = user.email;
  } else {
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId: input.tenantId,
        OR: [{ id: input.requesterId }, { email: input.requesterId.toLowerCase() }],
      },
    });
    if (customer?.email) {
      toEmail = customer.email;
    } else if (input.requesterId.includes('@')) {
      toEmail = input.requesterId;
    }
  }

  if (!toEmail) return 'no_recipient';

  const mailbox = await findActiveMailbox(input.tenantId, input.workspaceId);
  if (!mailbox) return 'no_mailbox';

  const facing = await getTenantFacing(input.tenantId);
  const rendered = await renderMail(input.tenantId, 'ack', facing, {
    brand: facing.brandName,
    ticketId: input.ticketId,
    subject: input.subject,
  });
  return sendGraphMail({
    tenantId: input.tenantId,
    mailbox,
    toEmail,
    subject: rendered.subject,
    htmlBody: rendered.body,
  });
}
