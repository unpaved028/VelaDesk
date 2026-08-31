import { describe, expect, it } from 'vitest';
import { portalTicketWhere } from './ticketScope';

describe('portalTicketWhere', () => {
  it('scopes regular customers to their email', () => {
    expect(portalTicketWhere({ email: 'a@acme.com', tenantId: 't1' })).toEqual({
      tenantId: 't1',
      requesterId: 'a@acme.com',
    });
  });

  it('drops requesterId for customer admins', () => {
    expect(
      portalTicketWhere({ email: 'a@acme.com', tenantId: 't1', isCustomerAdmin: true })
    ).toEqual({ tenantId: 't1' });
  });
});
