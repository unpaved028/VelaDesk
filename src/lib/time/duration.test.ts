import { describe, expect, it } from 'vitest';
import { formatDurationMinutes, parseDurationMinutes } from './duration';

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

describe('formatDurationMinutes', () => {
  it('formats hours and minutes', () => {
    expect(formatDurationMinutes(15)).toBe('15m');
    expect(formatDurationMinutes(60)).toBe('1h');
    expect(formatDurationMinutes(90)).toBe('1h 30m');
    expect(formatDurationMinutes(0)).toBe('0m');
  });
});
