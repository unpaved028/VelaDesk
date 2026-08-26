import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isAdminPortalRole,
  isDevAuthBypassEnabled,
  isStaffRole,
  isSuperAdminRole,
} from './roles';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isStaffRole', () => {
  it('accepts SUPER_ADMIN, ADMIN, and AGENT', () => {
    expect(isStaffRole('SUPER_ADMIN')).toBe(true);
    expect(isStaffRole('ADMIN')).toBe(true);
    expect(isStaffRole('AGENT')).toBe(true);
  });

  it('rejects CUSTOMER and empty values', () => {
    expect(isStaffRole('CUSTOMER')).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
    expect(isStaffRole('')).toBe(false);
  });
});

describe('isAdminPortalRole', () => {
  it('allows SUPER_ADMIN and ADMIN only', () => {
    expect(isAdminPortalRole('SUPER_ADMIN')).toBe(true);
    expect(isAdminPortalRole('ADMIN')).toBe(true);
    expect(isAdminPortalRole('AGENT')).toBe(false);
  });
});

describe('isSuperAdminRole', () => {
  it('matches SUPER_ADMIN only', () => {
    expect(isSuperAdminRole('SUPER_ADMIN')).toBe(true);
    expect(isSuperAdminRole('ADMIN')).toBe(false);
  });
});

describe('isDevAuthBypassEnabled', () => {
  it('is true only when not production and cookie is true', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isDevAuthBypassEnabled('true')).toBe(true);
    expect(isDevAuthBypassEnabled('false')).toBe(false);
  });

  it('is ignored in production even with the cookie', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(isDevAuthBypassEnabled('true')).toBe(false);
  });
});
