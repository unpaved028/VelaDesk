/**
 * Outbound public replies use subject `[#TK-{id}] …`.
 * Outlook/Graph keep that token on Re:/Fwd: so inbound can thread.
 */
const TICKET_REF = /\[#TK-(\d+)\]/i;
const REPLY_PREFIX = /^(re|aw|wg|fwd|fw)\s*:\s*/i;

export function extractTicketIdFromSubject(subject?: string | null): number | null {
  return extractTicketIdFromText(subject);
}

export function extractTicketIdFromText(text?: string | null): number | null {
  if (!text) return null;
  const match = text.match(TICKET_REF);
  if (!match) return null;
  const id = Number.parseInt(match[1], 10);
  if (!Number.isFinite(id) || id < 1) return null;
  return id;
}

/** Strip Re:/AW:/Fwd: wrappers so a customer reply matches the original subject. */
export function normalizeSubject(subject?: string | null): string {
  if (!subject) return '';
  let value = subject.replace(/\s+/g, ' ').trim();
  while (REPLY_PREFIX.test(value)) {
    value = value.replace(REPLY_PREFIX, '').trim();
  }
  return value.toLowerCase();
}
