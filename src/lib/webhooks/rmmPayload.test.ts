import { describe, expect, it } from 'vitest';
import { normalizeRmmStatus, parseRmmPayload } from './rmmPayload';

describe('normalizeRmmStatus', () => {
  it('maps monitoring synonyms', () => {
    expect(normalizeRmmStatus('critical')).toBe('DOWN');
    expect(normalizeRmmStatus('recovered')).toBe('UP');
    expect(normalizeRmmStatus('maybe')).toBeNull();
  });
});

describe('parseRmmPayload', () => {
  it('parses a DOWN alert', () => {
    const parsed = parseRmmPayload({
      status: 'DOWN',
      alertId: 'prtg-99',
      host: 'fw-01',
      title: 'Firewall unreachable',
    });
    expect(parsed).toMatchObject({
      status: 'DOWN',
      alertId: 'prtg-99',
      subject: 'Firewall unreachable',
    });
  });

  it('rejects missing fields', () => {
    expect(parseRmmPayload({ status: 'DOWN' })).toEqual({ error: 'alertId is required.' });
    expect(parseRmmPayload([])).toEqual({ error: 'JSON object payload required.' });
  });
});
