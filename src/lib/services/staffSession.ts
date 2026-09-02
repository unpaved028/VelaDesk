import crypto from 'crypto';
import { STAFF_SESSION_COOKIE_NAME } from '@/lib/auth/sessionCookies';
import type { StaffRole } from '@/lib/auth/roles';
import type { StaffSessionPayload, StaffSessionResult } from '@/types/staffSession';

/**
 * Staff bootstrap session — HMAC JWT for SUPER_ADMIN/ADMIN/AGENT while Entra SSO
 * is not configured. Domain-separated from the portal session key (SOP-05).
 */

const SESSION_TTL_HOURS = 24;

function getSigningKey(): Buffer {
  const masterKey = process.env.VELADESK_MASTER_KEY;
  if (!masterKey) {
    throw new Error('CRITICAL SECURITY ERROR: VELADESK_MASTER_KEY is not set in environment variables.');
  }

  return crypto
    .createHmac('sha256', masterKey)
    .update('VelaDesk:staff:session:v1')
    .digest();
}

function base64urlEncode(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buf.toString('base64url');
}

function base64urlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

export function createStaffSessionToken(input: {
  email: string;
  tenantId: string;
  userId: string;
  role: StaffRole;
}): string {
  const key = getSigningKey();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + SESSION_TTL_HOURS * 60 * 60;

  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload: StaffSessionPayload = {
    email: input.email.toLowerCase().trim(),
    tenantId: input.tenantId,
    userId: input.userId,
    role: input.role,
    iat: now,
    exp,
  };
  const payloadEncoded = base64urlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', key)
    .update(`${header}.${payloadEncoded}`)
    .digest();

  return `${header}.${payloadEncoded}.${base64urlEncode(signature)}`;
}

export function verifyStaffSessionToken(token: string): StaffSessionResult {
  if (!token) {
    return { authenticated: false, session: null, reason: 'No session token provided.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { authenticated: false, session: null, reason: 'Malformed session token.' };
  }

  const [header, payloadEncoded, signatureEncoded] = parts;
  const key = getSigningKey();
  const expectedSignature = crypto
    .createHmac('sha256', key)
    .update(`${header}.${payloadEncoded}`)
    .digest();
  const actualSignature = Buffer.from(signatureEncoded, 'base64url');

  if (
    expectedSignature.length !== actualSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return { authenticated: false, session: null, reason: 'Invalid session signature.' };
  }

  let payload: StaffSessionPayload;
  try {
    payload = JSON.parse(base64urlDecode(payloadEncoded)) as StaffSessionPayload;
  } catch {
    return { authenticated: false, session: null, reason: 'Failed to decode session payload.' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) {
    return { authenticated: false, session: null, reason: 'Session has expired.' };
  }

  if (!payload.email || !payload.tenantId || !payload.userId || !payload.role) {
    return { authenticated: false, session: null, reason: 'Session is missing required claims.' };
  }

  return { authenticated: true, session: payload };
}

export function staffSessionCookieOptions(maxAgeSeconds: number, secure: boolean) {
  return {
    httpOnly: true as const,
    // Secure only when the public origin is HTTPS. Production HTTP (Pi first-run)
    // must still accept the session cookie.
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export { STAFF_SESSION_COOKIE_NAME, SESSION_TTL_HOURS };
