/**
 * Pure role helpers — safe for Edge Middleware (no Prisma, no Auth.js).
 * SOP-05: SUPER_ADMIN = instance owner, ADMIN = tenant admin.
 */

export type StaffRole = 'SUPER_ADMIN' | 'ADMIN' | 'AGENT';
export type AdminPortalRole = 'SUPER_ADMIN' | 'ADMIN';

export function isStaffRole(role: string | undefined): role is StaffRole {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'AGENT';
}

export function isAdminPortalRole(role: string | undefined): role is AdminPortalRole {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

export function isSuperAdminRole(role: string | undefined): boolean {
  return role === 'SUPER_ADMIN';
}

/** DEV_BYPASS_AUTH is ignored in production (SOP-05). */
export function isDevAuthBypassEnabled(bypassCookie: string | undefined): boolean {
  return process.env.NODE_ENV !== 'production' && bypassCookie === 'true';
}
