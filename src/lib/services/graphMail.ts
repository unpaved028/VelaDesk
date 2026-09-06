import { prisma } from '@/lib/db/prisma';
import { decryptSecret } from './encryption';

export type MailDelivery = 'sent' | 'no_mailbox' | 'no_recipient' | 'graph_error';

interface GraphMailbox {
  mailboxAddress: string;
  clientId: string;
  clientSecret: string;
  msTenantId: string;
}

export async function findActiveMailbox(
  tenantId: string,
  workspaceId?: string
): Promise<GraphMailbox | null> {
  const config = workspaceId
    ? await prisma.mailboxConfig.findFirst({
        where: { tenantId, workspaceId, isActive: true },
      })
    : await prisma.mailboxConfig.findFirst({
        where: { tenantId, isActive: true },
      });

  if (!config) return null;

  return {
    mailboxAddress: config.mailboxAddress,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    msTenantId: config.msTenantId,
  };
}

export async function sendGraphMail(input: {
  tenantId: string;
  mailbox: GraphMailbox;
  toEmail: string;
  subject: string;
  htmlBody: string;
}): Promise<MailDelivery> {
  try {
    const clientSecret = decryptSecret(input.mailbox.clientSecret, input.tenantId);
    const tokenParams = new URLSearchParams({
      client_id: input.mailbox.clientId,
      scope: 'https://graph.microsoft.com/.default',
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    });

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${input.mailbox.msTenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams,
      }
    );

    if (!tokenResponse.ok) {
      console.error('[graphMail] Failed to get Graph token', await tokenResponse.text());
      return 'graph_error';
    }

    const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenPayload.access_token) {
      return 'graph_error';
    }

    const mailResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${input.mailbox.mailboxAddress}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenPayload.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject: input.subject,
            body: { contentType: 'Html', content: input.htmlBody },
            toRecipients: [{ emailAddress: { address: input.toEmail } }],
          },
          saveToSentItems: 'true',
        }),
      }
    );

    if (!mailResponse.ok) {
      console.error('[graphMail] Failed to send mail', await mailResponse.text());
      return 'graph_error';
    }

    return 'sent';
  } catch (error) {
    console.error('[graphMail] Critical error while sending mail:', error);
    return 'graph_error';
  }
}
