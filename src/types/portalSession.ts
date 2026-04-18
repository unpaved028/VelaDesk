/**
 * Portal Session types for the Customer Portal authentication layer.
 * Used by portalSession.ts service, middleware, and portal API routes.
 */

/** Payload encoded inside the portal session JWT */
export interface PortalSessionPayload {
  /** Customer's verified email address (from Magic Link) */
  email: string;
  /** Tenant this customer belongs to — enforces data isolation */
  tenantId: string;
  /** JWT issued-at timestamp (seconds since epoch) */
  iat: number;
  /** JWT expiry timestamp (seconds since epoch) */
  exp: number;
}

/** Result of parsing a portal session from request cookies */
export interface PortalSessionResult {
  authenticated: boolean;
  session: PortalSessionPayload | null;
  /** Human-readable reason if authentication failed */
  reason?: string;
}
