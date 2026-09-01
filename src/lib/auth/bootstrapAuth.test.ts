import { describe, expect, it } from 'vitest';
import {
  isStaffBootstrapEnabled,
  postVerifyPath,
  resolveMagicLinkAudience,
  unauthenticatedSignInPath,
} from './bootstrapAuth';

describe('isStaffBootstrapEnabled', () => {
  it('is on until Entra is marked configured', () => {
    expect(isStaffBootstrapEnabled(false)).toBe(true);
    expect(isStaffBootstrapEnabled(undefined)).toBe(true);
    expect(isStaffBootstrapEnabled(null)).toBe(true);
  });

  it('turns off once Entra is configured', () => {
    expect(isStaffBootstrapEnabled(true)).toBe(false);
  });
});

describe('resolveMagicLinkAudience', () => {
  it('always issues portal links for CUSTOMER users', () => {
    expect(
      resolveMagicLinkAudience({
        staffBootstrapEnabled: false,
        userRole: 'CUSTOMER',
        hasCustomerRecord: false,
      })
    ).toBe('portal');
  });

  it('issues staff links only while bootstrap is on', () => {
    expect(
      resolveMagicLinkAudience({
        staffBootstrapEnabled: true,
        userRole: 'SUPER_ADMIN',
        hasCustomerRecord: false,
      })
    ).toBe('staff');
    expect(
      resolveMagicLinkAudience({
        staffBootstrapEnabled: false,
        userRole: 'ADMIN',
        hasCustomerRecord: false,
      })
    ).toBe('none');
    expect(
      resolveMagicLinkAudience({
        staffBootstrapEnabled: true,
        userRole: 'AGENT',
        hasCustomerRecord: false,
      })
    ).toBe('staff');
  });

  it('falls back to a legacy Customer row when no User exists', () => {
    expect(
      resolveMagicLinkAudience({
        staffBootstrapEnabled: true,
        userRole: null,
        hasCustomerRecord: true,
      })
    ).toBe('portal');
  });

  it('does not enumerate unknown emails', () => {
    expect(
      resolveMagicLinkAudience({
        staffBootstrapEnabled: true,
        userRole: null,
        hasCustomerRecord: false,
      })
    ).toBe('none');
  });
});

describe('postVerifyPath', () => {
  it('sends admins to /admin and agents to /tickets', () => {
    expect(postVerifyPath('staff', 'SUPER_ADMIN')).toBe('/admin');
    expect(postVerifyPath('staff', 'ADMIN')).toBe('/admin');
    expect(postVerifyPath('staff', 'AGENT')).toBe('/tickets');
  });

  it('sends portal audience to /portal', () => {
    expect(postVerifyPath('portal', 'CUSTOMER')).toBe('/portal');
  });
});

describe('unauthenticatedSignInPath', () => {
  it('uses Magic Link login until Entra is live', () => {
    expect(unauthenticatedSignInPath(true)).toBe('/login');
    expect(unauthenticatedSignInPath(false)).toBe('/api/auth/signin');
  });
});
