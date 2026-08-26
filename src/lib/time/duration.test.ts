import { describe, expect, it } from 'vitest';
import { parseDurationMinutes } from './duration';

describe('parseDurationMinutes', () => {
  it('parses plain minutes', () => {
    expect(parseDurationMinutes('15')).toBe(15);
    expect(parseDurationMinutes('90')).toBe(90);
  });

  it('parses hour and minute tokens', () => {
    expect(parseDurationMinutes('15m')).toBe(15);
    expect(parseDurationMinutes('1h')).toBe(60);
    expect(parseDurationMinutes('1h 30m')).toBe(90);
    expect(parseDurationMinutes('2h30m')).toBe(150);
  });

  it('rejects empty or junk input', () => {
    expect(parseDurationMinutes('')).toBeNull();
    expect(parseDurationMinutes('0')).toBeNull();
    expect(parseDurationMinutes('abc')).toBeNull();
    expect(parseDurationMinutes('1h extra')).toBeNull();
  });
});
