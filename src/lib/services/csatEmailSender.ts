import { prisma } from '@/lib/db/prisma';
import { decryptSecret } from './encryption';
import { generateCsatToken } from './csatService';
import { getTenantFacing } from './tenantFacing';
import { renderMail } from './mailTemplates';

/**
 * Sends a CSAT survey email to the ticket requester when a ticket is resolved.
 * Uses the same Graph API authentication pattern as emailSender.ts.
 * The email contains 3 smiley-links (Good / Neutral / Bad) that each point
 * to the /api/csat/[token]?score=... endpoint.
 */
export async function sendCsatEmail(
  ticketId: number,
  tenantId: string,
  workspaceId: string,
  requesterId: string
): Promise<boolean> {
  try {
    // 1. Resolve requester email
    let toEmail = '';
    const user = await prisma.user.findUnique({ where: { id: requesterId } });
    if (user?.email) {
      toEmail = user.email;
    } else {
      const customer = await prisma.customer.findUnique({ where: { id: requesterId } });
      if (customer?.email) {
        toEmail = customer.email;
      }
    }

    if (!toEmail) {
      console.warn(`[csatEmail] Could not resolve email for requesterId: ${requesterId}`);
      return false;
    }

    // 2. Generate single-use CSAT token
    const { csatUrl } = await generateCsatToken(ticketId, tenantId);

    const facing = await getTenantFacing(tenantId);
    const rendered = await renderMail(tenantId, 'csat', facing, {
      brand: facing.brandName,
      ticketId,
      link: csatUrl,
    });
    const htmlBody = rendered.body;

    // 4. Get MailboxConfig for this workspace
    const config = await prisma.mailboxConfig.findUnique({
      where: { workspaceId },
    });

    if (!config || !config.isActive) {
      console.warn(`[csatEmail] No active MailboxConfig for workspace ${workspaceId}. Skipping.`);
      console.info(`[csatEmail] MOCK SEND CSAT to ${toEmail} for Ticket #${ticketId}`);
      return true; // Don't block the flow in dev
    }

    const fromEmail = config.mailboxAddress;
    const clientSecret = decryptSecret(config.clientSecret, tenantId);

    // 5. Authenticate with Graph API
    const tokenParams = new URLSearchParams({
      client_id: config.clientId,
      scope: 'https://graph.microsoft.com/.default',
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    });

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${config.msTenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams,
      }
    );

    if (!tokenResponse.ok) {
      console.error('[csatEmail] Failed to get Graph Auth Token', await tokenResponse.text());
      return false;
    }

    const { access_token } = await tokenResponse.json();

    // 6. Send email
    const mailPayload = {
      message: {
        subject: rendered.subject,
        body: { contentType: 'Html', content: htmlBody },
        toRecipients: [{ emailAddress: { address: toEmail } }],
      },
      saveToSentItems: 'true',
    };

    const mailResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mailPayload),
      }
    );

    if (!mailResponse.ok) {
      console.error('[csatEmail] Failed to send CSAT email', await mailResponse.text());
      return false;
    }

    console.info(`[csatEmail] CSAT survey sent to ${toEmail} for Ticket #${ticketId}`);
    return true;
  } catch (error) {
    console.error('[csatEmail] Critical error sending CSAT email:', error);
    return false;
  }
}
