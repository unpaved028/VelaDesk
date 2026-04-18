import { prisma } from '@/lib/db/prisma';
import { decryptSecret } from './encryption';

/**
 * Sends a public reply notification to the ticket requester using Microsoft Graph API (if configured).
 * The Graph API credentials from MailboxConfig are decrypted securely according to SOP-05.
 */
export async function sendTicketReplyNotification(
  ticketId: number,
  tenantId: string,
  workspaceId: string,
  requesterId: string,
  htmlBody: string
): Promise<boolean> {
  try {
    // 1. Resolve requester email (could be Customer or User)
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
      console.warn(`[emailSender] Could not resolve email address for requesterId: ${requesterId}`);
      return false;
    }

    // 2. Get MailboxConfig for this workspace
    const config = await prisma.mailboxConfig.findUnique({
      where: { workspaceId }
    });

    if (!config || !config.isActive) {
      console.warn(`[emailSender] No active MailboxConfig found for workspace ${workspaceId}. Skipping email send.`);
      // Mock success for development if no config is available, to avoid blocking the user flow
      console.info(`[emailSender] MOCK SEND to ${toEmail}: ${htmlBody.substring(0, 50)}...`);
      return true; 
    }

    // Use the mailboxAddress from the workspace's MailboxConfig (0.13.1)
    // This is the M365 Shared Mailbox address configured for this workspace
    const fromEmail = config.mailboxAddress;
    
    // Decrypt the client secret using tenantId (Tenant-Isolation)
    const clientSecret = decryptSecret(config.clientSecret, tenantId);

    // 3. Authenticate with MSAL (Client Credentials Flow)
    // Using simple fetch without extra dependencies for maximum compatibility
    const tokenParams = new URLSearchParams({
      client_id: config.clientId,
      scope: 'https://graph.microsoft.com/.default',
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    });

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${config.msTenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams
    });

    if (!tokenResponse.ok) {
        console.error('[emailSender] Failed to get Graph Auth Token', await tokenResponse.text());
        return false;
    }

    const { access_token } = await tokenResponse.json();

    // 4. Send Email via Graph API using the workspace's shared mailbox
    const ticketPrefix = `[#TK-${ticketId}]`;
    const subject = `${ticketPrefix} New update on your request`;

    const mailPayload = {
      message: {
        subject: subject,
        body: {
          contentType: "Html",
          content: htmlBody
        },
        toRecipients: [
          {
            emailAddress: {
              address: toEmail
            }
          }
        ]
      },
      saveToSentItems: "true"
    };

    const mailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mailPayload)
    });

    if (!mailResponse.ok) {
        console.error('[emailSender] Failed to send email via Graph API', await mailResponse.text());
        return false;
    }

    console.info(`[emailSender] Successfully sent notification email to ${toEmail} for Ticket ${ticketId}`);
    return true;

  } catch (error) {
    console.error('[emailSender] Critical error while trying to send email:', error);
    return false;
  }
}
