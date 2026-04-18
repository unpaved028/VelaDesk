/**
 * Magic Link types for passwordless Customer Portal authentication.
 * Used by the magicLink.ts service and the /login + /api/auth routes.
 */

/** Result of a successful token generation */
export interface MagicLinkGenerationResult {
  token: string;
  magicLinkUrl: string;
  expiresAt: Date;
}

/** Result of a token validation attempt */
export interface MagicLinkValidationResult {
  valid: boolean;
  email: string | null;
  tenantId: string | null;
  /** Human-readable reason if validation failed */
  reason?: string;
}

/** Configuration passed to generateMagicLink */
export interface MagicLinkConfig {
  email: string;
  tenantId: string;
  /** Token lifetime in minutes. Default: 15 */
  ttlMinutes?: number;
}
