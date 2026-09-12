import type { TenantFacing } from './tenantFacing';

/** [#TK-n] stays in every language so inbound mail can thread. */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inc(ticketId: number): string {
  return `INC-${ticketId.toString().padStart(4, '0')}`;
}

export function publicReplySubject(ticketId: number, facing: TenantFacing): string {
  if (facing.locale === 'en') {
    return `[#TK-${ticketId}] New update on your request`;
  }
  return `[#TK-${ticketId}] Neue Nachricht zu Ihrer Anfrage`;
}

export function magicLinkSubject(facing: TenantFacing): string {
  if (facing.locale === 'en') {
    return `Your ${facing.brandName} sign-in link`;
  }
  return `Ihr ${facing.brandName}-Anmeldelink`;
}

export function magicLinkHtml(magicLinkUrl: string, facing: TenantFacing): string {
  if (facing.locale === 'en') {
    return `
    <p>Sign in to ${escapeHtml(facing.brandName)} with this one-time link (valid for 15 minutes):</p>
    <p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
  `;
  }
  return `
    <p>Melden Sie sich bei ${escapeHtml(facing.brandName)} mit diesem einmaligen Link an (15 Minuten gültig):</p>
    <p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
  `;
}

export function ticketAckSubject(ticketId: number, facing: TenantFacing): string {
  if (facing.locale === 'en') {
    return `[#TK-${ticketId}] We received your request`;
  }
  return `[#TK-${ticketId}] Ihre Anfrage ist eingegangen`;
}

export function ticketAckHtml(ticketId: number, subject: string, facing: TenantFacing): string {
  const ref = inc(ticketId);
  if (facing.locale === 'en') {
    return `
    <p>Hello,</p>
    <p>${escapeHtml(facing.brandName)} received your request and logged it as <strong>${ref}</strong>.</p>
    <p>${escapeHtml(subject)}</p>
    <p>If you reply by email, please keep <code>[#TK-${ticketId}]</code> in the subject line.</p>
  `;
  }
  return `
    <p>Guten Tag,</p>
    <p>${escapeHtml(facing.brandName)} hat Ihre Anfrage erhalten und unter <strong>${ref}</strong> erfasst.</p>
    <p>${escapeHtml(subject)}</p>
    <p>Wenn Sie per E-Mail antworten, lassen Sie bitte <code>[#TK-${ticketId}]</code> in der Betreffzeile stehen.</p>
  `;
}

export function csatSubject(ticketId: number, facing: TenantFacing): string {
  if (facing.locale === 'en') {
    return `[#TK-${ticketId}] How was your experience?`;
  }
  return `[#TK-${ticketId}] Wie war Ihre Erfahrung?`;
}

export function csatEmailHtml(
  ticketId: number,
  csatBaseUrl: string,
  facing: TenantFacing
): string {
  const goodUrl = `${csatBaseUrl}?score=GOOD`;
  const neutralUrl = `${csatBaseUrl}?score=NEUTRAL`;
  const badUrl = `${csatBaseUrl}?score=BAD`;
  const brand = escapeHtml(facing.brandName);
  const copy =
    facing.locale === 'en'
      ? {
          lang: 'en',
          kicker: 'Your feedback helps us',
          closed: `Your request <strong>#TK-${ticketId}</strong> is closed.`,
          ask: 'How was your experience? Please pick one option:',
          good: 'Good',
          neutral: 'Okay',
          bad: 'Poor',
          expiry: 'This link is valid for 7 days.',
        }
      : {
          lang: 'de',
          kicker: 'Ihr Feedback hilft uns',
          closed: `Ihre Anfrage <strong>#TK-${ticketId}</strong> wurde geschlossen.`,
          ask: 'Wie war Ihre Erfahrung? Bitte eine der Optionen wählen:',
          good: 'Gut',
          neutral: 'Geht so',
          bad: 'Schlecht',
          expiry: 'Dieser Link ist 7 Tage gültig.',
        };

  return `
<!DOCTYPE html>
<html lang="${copy.lang}">
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Arial, sans-serif; background:#f4f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg, #0f172a, #1e3a5f); padding:32px 40px;">
        <h1 style="color:#ffffff; font-size:20px; margin:0; font-weight:600;">${brand}</h1>
        <p style="color:#94a3b8; font-size:13px; margin:8px 0 0;">${copy.kicker}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px;">
        <p style="color:#334155; font-size:15px; line-height:1.6; margin:0 0 8px;">${copy.closed}</p>
        <p style="color:#64748b; font-size:14px; line-height:1.6; margin:0 0 28px;">${copy.ask}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" width="33%">
              <a href="${goodUrl}" style="text-decoration:none; display:inline-block; text-align:center;">
                <div style="font-size:48px; line-height:1;">😊</div>
                <div style="color:#16a34a; font-size:13px; font-weight:600; margin-top:8px;">${copy.good}</div>
              </a>
            </td>
            <td align="center" width="33%">
              <a href="${neutralUrl}" style="text-decoration:none; display:inline-block; text-align:center;">
                <div style="font-size:48px; line-height:1;">😐</div>
                <div style="color:#ca8a04; font-size:13px; font-weight:600; margin-top:8px;">${copy.neutral}</div>
              </a>
            </td>
            <td align="center" width="33%">
              <a href="${badUrl}" style="text-decoration:none; display:inline-block; text-align:center;">
                <div style="font-size:48px; line-height:1;">😞</div>
                <div style="color:#dc2626; font-size:13px; font-weight:600; margin-top:8px;">${copy.bad}</div>
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px; background:#f8fafc; border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8; font-size:11px; margin:0; text-align:center;">${copy.expiry}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
