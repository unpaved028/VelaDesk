import { prisma } from '@/lib/db/prisma';
import { findActiveMailbox, sendGraphMail, type MailDelivery } from './graphMail';

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

  const delivery = await sendGraphMail({
    tenantId,
    mailbox,
    toEmail,
    subject: `[#TK-${ticketId}] New update on your request`,
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

  const htmlBody = `
    <p>Sign in to VelaDesk with this single-use link (expires in 15 minutes):</p>
    <p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
  `;

  return sendGraphMail({
    tenantId,
    mailbox,
    toEmail,
    subject: 'Your VelaDesk sign-in link',
    htmlBody,
  });
}
