/**
 * Outbound public replies use subject `[#TK-{id}] …`.
 * Outlook/Graph keep that token on Re:/Fwd: so inbound can thread.
 */
const TICKET_SUBJECT_REF = /\[#TK-(\d+)\]/i;

export function extractTicketIdFromSubject(subject?: string | null): number | null {
  if (!subject) return null;
  const match = subject.match(TICKET_SUBJECT_REF);
  if (!match) return null;
  const id = Number.parseInt(match[1], 10);
  if (!Number.isFinite(id) || id < 1) return null;
  return id;
}
