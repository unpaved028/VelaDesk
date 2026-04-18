import crypto from 'crypto';
import { PortalSessionPayload, PortalSessionResult } from '@/types/portalSession';

/**
 * Portal Session Service — JWT-based session management for the Customer Portal (v0.8.3)
 *
 * Security design decisions:
 * - Uses HMAC-SHA256 for JWT signing (simple, stateless, no external deps).
 * - Session stored in HTTP-only, Secure, SameSite=Lax cookie to prevent XSS/CSRF.
 * - Session lifetime is 24h — long enough for usability, short enough for security.
 * - No external JWT library needed — we implement a minimal, auditable JWT encoder/decoder.
 * - The session encodes email + tenantId so every portal request can enforce data isolation
 *   without additional DB lookups.
 *
 * Why custom JWT instead of a library?
 * - Zero dependencies = smaller attack surface.
 * - The portal session JWT is simple (3 claims) — no need for the complexity of jose/jsonwebtoken.
 * - Full auditability of the signing/verification code.
 */

const SESSION_COOKIE_NAME = 'VELADESK_portal_session';
const SESSION_TTL_HOURS = 24;

/**
 * Derives the HMAC signing key from VELADESK_MASTER_KEY.
 * We use a domain-separated derivation so portal session keys are distinct from
 * the encryption keys used for mailbox secrets (SOP-05 compliance).
 */
function getSigningKey(): Buffer {
  const masterKey = process.env.VELADESK_MASTER_KEY;
  if (!masterKey) {
    throw new Error('CRITICAL SECURITY ERROR: VELADESK_MASTER_KEY is not set in environment variables.');
  }

  // Domain separation: derive a portal-specific key from the master key
  return crypto
    .createHmac('sha256', masterKey)
    .update('VelaDesk:portal:session:v1')
    .digest();
}

/**
 * Base64url-encodes a buffer or string (JWT standard encoding).
 * Unlike standard Base64, this is URL-safe and has no padding.
 */
function base64urlEncode(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buf.toString('base64url');
}

/**
 * Base64url-decodes a string to UTF-8 (JWT standard decoding).
 */
function base64urlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

/**
 * Creates a signed JWT session token encoding the customer's email and tenantId.
 *
 * @param email - Verified email address (from Magic Link validation)
 * @param tenantId - Tenant this customer belongs to
 * @returns Signed JWT string
 */
export function createSessionToken(email: string, tenantId: string): string {
  const key = getSigningKey();

  const now = Math.floor(Date.now() / 1000);
  const exp = now + SESSION_TTL_HOURS * 60 * 60;

  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

  const payload: PortalSessionPayload = {
    email: email.toLowerCase().trim(),
    tenantId,
    iat: now,
    exp,
  };

  const payloadEncoded = base64urlEncode(JSON.stringify(payload));

  // HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', key)
    .update(`${header}.${payloadEncoded}`)
    .digest();

  return `${header}.${payloadEncoded}.${base64urlEncode(signature)}`;
}

/**
 * Verifies and decodes a portal session JWT.
 *
 * Verification checks:
 * 1. Structural validity (3 dot-separated parts)
 * 2. Signature matches (HMAC-SHA256)
 * 3. Token is not expired (exp > now)
 * 4. Required claims are present (email, tenantId)
 *
 * @param token - The raw JWT from the session cookie
 * @returns Session result with payload on success
 */
export function verifySessionToken(token: string): PortalSessionResult {
  if (!token) {
    return { authenticated: false, session: null, reason: 'No session token provided.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { authenticated: false, session: null, reason: 'Malformed session token.' };
  }

  const [header, payloadEncoded, signatureEncoded] = parts;

  // Verify signature
  const key = getSigningKey();
  const expectedSignature = crypto
    .createHmac('sha256', key)
    .update(`${header}.${payloadEncoded}`)
    .digest();

  const actualSignature = Buffer.from(signatureEncoded, 'base64url');

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(expectedSignature, actualSignature)) {
    return { authenticated: false, session: null, reason: 'Invalid session signature.' };
  }

  // Decode payload
  let payload: PortalSessionPayload;
  try {
    payload = JSON.parse(base64urlDecode(payloadEncoded)) as PortalSessionPayload;
  } catch {
    return { authenticated: false, session: null, reason: 'Failed to decode session payload.' };
  }

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) {
    return { authenticated: false, session: null, reason: 'Session has expired.' };
  }

  // Validate required claims
  if (!payload.email || !payload.tenantId) {
    return { authenticated: false, session: null, reason: 'Session is missing required claims.' };
  }

  return {
    authenticated: true,
    session: payload,
  };
}

/** The name of the HTTP-only cookie storing the portal session */
export { SESSION_COOKIE_NAME };

/** Session TTL in hours — for cookie maxAge calculation */
export { SESSION_TTL_HOURS };
