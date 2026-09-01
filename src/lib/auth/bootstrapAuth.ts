import { isAdminPortalRole, isStaffRole } from '@/lib/auth/roles';

export type MagicLinkAudience = 'none' | 'portal' | 'staff';

/**
 * Until SystemConfig.entraIdConfigured is true, staff cannot use Entra SSO
 * and must sign in with the same Magic Link flow as portal customers.
 */
export function isStaffBootstrapEnabled(entraIdConfigured: boolean | null | undefined): boolean {
  return entraIdConfigured !== true;
}

export function resolveMagicLinkAudience(input: {
  staffBootstrapEnabled: boolean;
  userRole: string | null;
  hasCustomerRecord: boolean;
}): MagicLinkAudience {
  if (input.userRole === 'CUSTOMER') return 'portal';
  if (input.userRole && isStaffRole(input.userRole)) {
    return input.staffBootstrapEnabled ? 'staff' : 'none';
  }
  if (input.hasCustomerRecord) return 'portal';
  return 'none';
}

export function postVerifyPath(
  audience: Exclude<MagicLinkAudience, 'none'>,
  role: string | undefined
): string {
  if (audience === 'staff') {
    return isAdminPortalRole(role) ? '/admin' : '/tickets';
  }
  return '/portal';
}

export function unauthenticatedSignInPath(staffBootstrapEnabled: boolean): string {
  return staffBootstrapEnabled ? '/login' : '/api/auth/signin';
}
