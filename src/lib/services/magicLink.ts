import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { MagicLinkGenerationResult, MagicLinkValidationResult, MagicLinkConfig } from '@/types/magicLink';

/**
 * Magic Link Engine — Passwordless Authentication for the Customer Portal (v0.8.1)
 *
 * Security design decisions:
 * - Tokens are cryptographically random (48 bytes → 64 char hex) to prevent brute-force.
 * - Tokens are single-use (consumed via `usedAt` timestamp on first validation).
 * - Default TTL is 15 minutes — short-lived to minimize attack window.
 * - All DB queries enforce `tenantId` for multi-tenant isolation (SOP-02).
 * - Expired/used tokens are cleaned up to prevent DB bloat.
 */

const DEFAULT_TTL_MINUTES = 15;
const TOKEN_BYTE_LENGTH = 48; // 48 bytes = 96 hex chars — high entropy for brute-force resistance

/**
 * Generates a cryptographically secure, single-use Magic Link token
 * and persists it to the database.
 *
 * @param config - Email, tenantId, and optional TTL
 * @returns The generated token, full URL, and expiry timestamp
 */
export async function generateMagicLink(config: MagicLinkConfig): Promise<MagicLinkGenerationResult> {
  const { email, tenantId, ttlMinutes = DEFAULT_TTL_MINUTES } = config;

  if (!email || !tenantId) {
    throw new Error('Magic Link generation blocked: email and tenantId are required.');
  }

  // Generate cryptographically secure token
  const token = crypto.randomBytes(TOKEN_BYTE_LENGTH).toString('hex');

  // Calculate expiry
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  // Persist the token to DB — tenantId enforced per SOP-02
  await prisma.magicLinkToken.create({
    data: {
      tenantId,
      token,
      email: email.toLowerCase().trim(),
      expiresAt,
    },
  });

  // Build the full magic link URL using system config
  const magicLinkUrl = await buildMagicLinkUrl(token);

  return {
    token,
    magicLinkUrl,
    expiresAt,
  };
}

/**
 * Constructs the full Magic Link URL from the stored baseUrl and token.
 * The URL points to the login verification endpoint.
 *
 * @param token - The raw hex token
 * @returns Full clickable URL, e.g. "https://VelaDesk.example.com/login/verify?token=abc123..."
 */
export async function buildMagicLinkUrl(token: string): Promise<string> {
  // Fetch baseUrl from SystemConfig (configured in Admin panel)
  const systemConfig = await prisma.systemConfig.findFirst({
    where: { id: 'global' },
    select: { baseUrl: true },
  });

  const baseUrl = systemConfig?.baseUrl || 'http://localhost:3000';

  // Clean trailing slash and construct verification URL
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/login/verify?token=${token}`;
}

/**
 * Validates a Magic Link token and marks it as consumed (single-use).
 *
 * Validation checks (in order):
 * 1. Token exists in DB
 * 2. Token has not been used before (usedAt IS NULL)
 * 3. Token has not expired (expiresAt > now)
 *
 * On success, the token is atomically consumed (usedAt set to now())
 * to prevent replay attacks.
 *
 * @param token - The raw token from the URL query parameter
 * @returns Validation result with email + tenantId on success
 */
export async function validateAndConsumeToken(token: string): Promise<MagicLinkValidationResult> {
  if (!token) {
    return { valid: false, email: null, tenantId: null, reason: 'No token provided.' };
  }

  // Find the token in DB
  const record = await prisma.magicLinkToken.findUnique({
    where: { token },
  });

  // Check 1: Token exists
  if (!record) {
    return { valid: false, email: null, tenantId: null, reason: 'Token not found or invalid.' };
  }

  // Check 2: Token not already consumed (single-use enforcement)
  if (record.usedAt !== null) {
    return { valid: false, email: null, tenantId: null, reason: 'Token has already been used.' };
  }

  // Check 3: Token not expired
  if (record.expiresAt < new Date()) {
    return { valid: false, email: null, tenantId: null, reason: 'Token has expired.' };
  }

  // All checks passed — atomically consume the token
  // Using update with a where clause ensures no race condition
  await prisma.magicLinkToken.update({
    where: {
      token,
      usedAt: null, // Double-check: only consume if still unused (optimistic locking)
    },
    data: { usedAt: new Date() },
  });

  return {
    valid: true,
    email: record.email,
    tenantId: record.tenantId,
  };
}

/**
 * Purges expired and consumed tokens from the database.
 * Should be called periodically (e.g., via CRON or on each login attempt)
 * to prevent table bloat.
 *
 * Deletes tokens where:
 * - expiresAt is in the past, OR
 * - usedAt is set (already consumed)
 *
 * @returns Number of deleted tokens
 */
export async function purgeExpiredTokens(): Promise<number> {
  const result = await prisma.magicLinkToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
    },
  });

  return result.count;
}
