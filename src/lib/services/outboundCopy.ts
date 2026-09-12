/** Customer-facing outbound mail is German. [#TK-n] stays for threading. */

export function publicReplySubject(ticketId: number): string {
  return `[#TK-${ticketId}] Neue Nachricht zu Ihrer Anfrage`;
}

export function magicLinkSubject(): string {
  return 'Ihr VelaDesk-Anmeldelink';
}

export function magicLinkHtml(magicLinkUrl: string): string {
  return `
    <p>Melden Sie sich bei VelaDesk mit diesem einmaligen Link an (15 Minuten gültig):</p>
    <p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
  `;
}

export function ticketAckSubject(ticketId: number): string {
  return `[#TK-${ticketId}] Ihre Anfrage ist eingegangen`;
}

export function ticketAckHtml(ticketId: number, subject: string): string {
  const inc = `INC-${ticketId.toString().padStart(4, '0')}`;
  return `
    <p>Guten Tag,</p>
    <p>wir haben Ihre Anfrage erhalten und unter <strong>${inc}</strong> erfasst.</p>
    <p>${escapeHtml(subject)}</p>
    <p>Wenn Sie per E-Mail antworten, lassen Sie bitte <code>[#TK-${ticketId}]</code> in der Betreffzeile stehen.</p>
  `;
}

export function csatSubject(ticketId: number): string {
  return `[#TK-${ticketId}] Wie war Ihre Erfahrung?`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
