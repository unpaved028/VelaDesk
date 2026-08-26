export type MagicLinkCheck =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Pure expiry/used checks so magic-link rules can be unit-tested without Prisma.
 */
export function evaluateMagicLinkRecord(
  record: { usedAt: Date | null; expiresAt: Date } | null,
  now = new Date()
): MagicLinkCheck {
  if (!record) {
    return { ok: false, reason: 'Token not found or invalid.' };
  }
  if (record.usedAt !== null) {
    return { ok: false, reason: 'Token has already been used.' };
  }
  if (record.expiresAt < now) {
    return { ok: false, reason: 'Token has expired.' };
  }
  return { ok: true };
}
