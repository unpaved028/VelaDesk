import { describe, expect, it } from 'vitest';
import { evaluateMagicLinkRecord } from './magicLinkRules';

describe('evaluateMagicLinkRecord', () => {
  const now = new Date('2026-08-26T12:00:00.000Z');

  it('rejects a missing record', () => {
    expect(evaluateMagicLinkRecord(null, now)).toEqual({
      ok: false,
      reason: 'Token not found or invalid.',
    });
  });

  it('rejects an already consumed token', () => {
    expect(
      evaluateMagicLinkRecord(
        { usedAt: new Date('2026-08-26T11:00:00.000Z'), expiresAt: new Date('2026-08-26T13:00:00.000Z') },
        now
      )
    ).toEqual({ ok: false, reason: 'Token has already been used.' });
  });

  it('rejects an expired unused token', () => {
    expect(
      evaluateMagicLinkRecord(
        { usedAt: null, expiresAt: new Date('2026-08-26T11:59:00.000Z') },
        now
      )
    ).toEqual({ ok: false, reason: 'Token has expired.' });
  });

  it('accepts a valid unused token', () => {
    expect(
      evaluateMagicLinkRecord(
        { usedAt: null, expiresAt: new Date('2026-08-26T12:05:00.000Z') },
        now
      )
    ).toEqual({ ok: true });
  });
});
