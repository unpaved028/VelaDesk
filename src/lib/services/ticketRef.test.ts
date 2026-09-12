import { describe, expect, it } from 'vitest';
import {
  extractTicketIdFromSubject,
  extractTicketIdFromText,
  normalizeSubject,
} from './ticketRef';

describe('extractTicketIdFromSubject', () => {
  it('reads the outbound public-reply token', () => {
    expect(extractTicketIdFromSubject('[#TK-1] New update on your request')).toBe(1);
    expect(extractTicketIdFromSubject('[#TK-1] Neue Nachricht zu Ihrer Anfrage')).toBe(1);
    expect(extractTicketIdFromSubject('[#TK-4] Ihre Anfrage ist eingegangen')).toBe(4);
  });

  it('reads Outlook Re: / Fwd: wrappers', () => {
    expect(extractTicketIdFromSubject('Re: [#TK-12] New update on your request')).toBe(12);
    expect(extractTicketIdFromSubject('AW: [#TK-3] New update on your request')).toBe(3);
    expect(extractTicketIdFromSubject('Fwd: [#TK-9] How was your experience?')).toBe(9);
  });

  it('ignores subjects without a ticket token', () => {
    expect(extractTicketIdFromSubject('Welcome to VelaDesk')).toBeNull();
    expect(extractTicketIdFromSubject('TK-1 without brackets')).toBeNull();
    expect(extractTicketIdFromSubject('')).toBeNull();
    expect(extractTicketIdFromSubject(null)).toBeNull();
  });
});

describe('extractTicketIdFromText', () => {
  it('reads a token from the body when the subject lost it', () => {
    expect(extractTicketIdFromText('On Tue you wrote [#TK-7] New update on your request')).toBe(7);
  });
});

describe('normalizeSubject', () => {
  it('strips stacked reply prefixes', () => {
    expect(normalizeSubject('Re: AW: Neues Ticket.')).toBe('neues ticket.');
    expect(normalizeSubject('Fwd: Printer offline in room 12')).toBe('printer offline in room 12');
  });
});
