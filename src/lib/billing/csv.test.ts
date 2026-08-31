import { describe, expect, it } from 'vitest';
import { buildBillingCsv, csvCell } from './csv';

describe('csvCell', () => {
  it('quotes commas and quotes', () => {
    expect(csvCell('hello')).toBe('hello');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });
});

describe('buildBillingCsv', () => {
  it('writes a header and escaped rows', () => {
    const csv = buildBillingCsv([
      {
        tenantName: 'Acme, Inc',
        ticketId: 12,
        subject: 'VPN down',
        agentName: 'Rene',
        agentEmail: 'rene@acme.com',
        durationMinutes: 45,
        isBillable: true,
        notes: 'On-site',
        createdAt: '2026-09-01T10:00:00.000Z',
      },
    ]);
    expect(csv.startsWith('tenant,ticketId,subject,agent,email,minutes,billable,notes,createdAt\r\n')).toBe(true);
    expect(csv).toContain('"Acme, Inc",12,VPN down,Rene,rene@acme.com,45,yes,On-site,2026-09-01T10:00:00.000Z');
  });
});
