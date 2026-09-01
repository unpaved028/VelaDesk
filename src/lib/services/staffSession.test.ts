import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSessionToken, verifySessionToken } from './portalSession';
import { createStaffSessionToken, verifyStaffSessionToken } from './staffSession';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('staffSession', () => {
  it('round-trips a staff bootstrap token', () => {
    vi.stubEnv('VELADESK_MASTER_KEY', 'test-master-key-staff-session');
    const token = createStaffSessionToken({
      email: 'rene@jung-it.consulting',
      tenantId: 'tenant_1',
      userId: 'user_1',
      role: 'SUPER_ADMIN',
    });
    const result = verifyStaffSessionToken(token);
    expect(result.authenticated).toBe(true);
    expect(result.session?.email).toBe('rene@jung-it.consulting');
    expect(result.session?.userId).toBe('user_1');
    expect(result.session?.role).toBe('SUPER_ADMIN');
  });

  it('rejects a portal session token (domain-separated keys)', () => {
    vi.stubEnv('VELADESK_MASTER_KEY', 'test-master-key-staff-session');
    const portalToken = createSessionToken('rene@jung-it.consulting', 'tenant_1');
    expect(verifyStaffSessionToken(portalToken).authenticated).toBe(false);
    const staffToken = createStaffSessionToken({
      email: 'rene@jung-it.consulting',
      tenantId: 'tenant_1',
      userId: 'user_1',
      role: 'ADMIN',
    });
    expect(verifySessionToken(staffToken).authenticated).toBe(false);
  });
});
