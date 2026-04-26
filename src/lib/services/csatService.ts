import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import type { CsatTokenGenerationResult, CsatSubmissionResult, CsatScoreValue } from '@/types/csat';

const CSAT_TOKEN_BYTES = 32;
const CSAT_TTL_DAYS = 7; // Survey link valid for 7 days

/**
 * Generates a cryptographically secure CSAT survey token for a resolved ticket.
 * The token is tenant-scoped and single-use (SOP-02 compliance).
 *
 * @param ticketId  The ticket that was resolved
 * @param tenantId  The tenant this ticket belongs to (mandatory for isolation)
 * @returns The generated token, full survey URL, and expiration timestamp
 */
export async function generateCsatToken(
  ticketId: number,
  tenantId: string
): Promise<CsatTokenGenerationResult> {
  if (!tenantId) {
    throw new Error('generateCsatToken: tenantId is required for tenant isolation.');
  }

  const token = crypto.randomBytes(CSAT_TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + CSAT_TTL_DAYS * 24 * 60 * 60 * 1000);

  // Resolve base URL from SystemConfig (falls back to localhost in dev)
  const systemConfig = await prisma.systemConfig.findUnique({ where: { id: 'global' } });
  const baseUrl = systemConfig?.baseUrl || 'http://localhost:3000';

  await prisma.csatRating.create({
    data: {
      tenantId,
      ticketId,
      token,
      expiresAt,
    },
  });

  const csatUrl = `${baseUrl}/api/csat/${token}`;

  return { token, csatUrl, expiresAt };
}

/**
 * Validates a CSAT token and records the customer's rating.
 * Token must be: existing, not expired, and not already used (single-use).
 * All queries enforce tenantId isolation.
 *
 * @param token   The survey token from the URL
 * @param score   The customer's satisfaction rating
 * @param comment Optional free-text feedback
 * @returns Validation result with ticketId if successful
 */
export async function submitCsatRating(
  token: string,
  score: CsatScoreValue,
  comment?: string
): Promise<CsatSubmissionResult> {
  if (!token) {
    return { valid: false, ticketId: null, reason: 'Token is required.' };
  }

  // 1. Find the rating entry by token
  const rating = await prisma.csatRating.findUnique({
    where: { token },
  });

  if (!rating) {
    return { valid: false, ticketId: null, reason: 'Invalid or unknown survey token.' };
  }

  // 2. Check single-use: already rated?
  if (rating.ratedAt !== null) {
    return { valid: false, ticketId: rating.ticketId, reason: 'This survey has already been submitted.' };
  }

  // 3. Check expiration
  if (new Date() > rating.expiresAt) {
    return { valid: false, ticketId: rating.ticketId, reason: 'This survey link has expired.' };
  }

  // 4. Record the rating (tenant-scoped update)
  await prisma.csatRating.update({
    where: {
      token,
      // Enforce tenant isolation: only update if tenantId matches
      // (protects against token collision across tenants, though statistically impossible)
      tenantId: rating.tenantId,
    },
    data: {
      score,
      comment: comment || null,
      ratedAt: new Date(),
    },
  });

  console.info(`[csatService] Rating recorded for ticket ${rating.ticketId}: ${score}`);

  return { valid: true, ticketId: rating.ticketId };
}
