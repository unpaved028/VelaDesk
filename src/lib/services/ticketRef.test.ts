import { describe, expect, it } from 'vitest';
import { extractTicketIdFromSubject } from './ticketRef';

describe('extractTicketIdFromSubject', () => {
  it('reads the outbound public-reply token', () => {
    expect(extractTicketIdFromSubject('[#TK-1] New update on your request')).toBe(1);
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
