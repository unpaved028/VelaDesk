import { prisma } from '@/lib/db/prisma';
import { decryptSecret } from './encryption';
import { generateCsatToken } from './csatService';

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

    // 3. Build the smiley-link email HTML
    const htmlBody = buildCsatEmailHtml(ticketId, csatUrl);

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
        subject: `[#TK-${ticketId}] How was your experience?`,
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

/**
 * Builds a clean, branded HTML email with 3 satisfaction smiley buttons.
 * Each button links to the CSAT API with the appropriate score query parameter.
 */
function buildCsatEmailHtml(ticketId: number, csatBaseUrl: string): string {
  const goodUrl = `${csatBaseUrl}?score=GOOD`;
  const neutralUrl = `${csatBaseUrl}?score=NEUTRAL`;
  const badUrl = `${csatBaseUrl}?score=BAD`;

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Arial, sans-serif; background:#f4f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg, #0f172a, #1e3a5f); padding:32px 40px;">
        <h1 style="color:#ffffff; font-size:20px; margin:0; font-weight:600;">
          VelaDesk
        </h1>
        <p style="color:#94a3b8; font-size:13px; margin:8px 0 0;">
          Your feedback matters to us
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px;">
        <p style="color:#334155; font-size:15px; line-height:1.6; margin:0 0 8px;">
          Your request <strong>#TK-${ticketId}</strong> has been resolved.
        </p>
        <p style="color:#64748b; font-size:14px; line-height:1.6; margin:0 0 28px;">
          How would you rate your experience? Click one of the options below:
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" width="33%">
              <a href="${goodUrl}" style="text-decoration:none; display:inline-block; text-align:center;">
                <div style="font-size:48px; line-height:1;">😊</div>
                <div style="color:#16a34a; font-size:13px; font-weight:600; margin-top:8px;">Good</div>
              </a>
            </td>
            <td align="center" width="33%">
              <a href="${neutralUrl}" style="text-decoration:none; display:inline-block; text-align:center;">
                <div style="font-size:48px; line-height:1;">😐</div>
                <div style="color:#ca8a04; font-size:13px; font-weight:600; margin-top:8px;">Neutral</div>
              </a>
            </td>
            <td align="center" width="33%">
              <a href="${badUrl}" style="text-decoration:none; display:inline-block; text-align:center;">
                <div style="font-size:48px; line-height:1;">😞</div>
                <div style="color:#dc2626; font-size:13px; font-weight:600; margin-top:8px;">Bad</div>
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px; background:#f8fafc; border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8; font-size:11px; margin:0; text-align:center;">
          This survey link expires in 7 days. Your feedback helps us improve.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
