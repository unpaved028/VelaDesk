import { describe, expect, it } from 'vitest';
import {
  currentYearMonth,
  formatYearMonth,
  monthRange,
  parseYearMonth,
  shiftYearMonth,
} from './monthRange';

describe('parseYearMonth', () => {
  it('accepts YYYY-MM', () => {
    expect(parseYearMonth('2026-09')).toEqual({ year: 2026, month: 9 });
  });

  it('rejects invalid values', () => {
    expect(parseYearMonth('2026-13')).toBeNull();
    expect(parseYearMonth('09-2026')).toBeNull();
    expect(parseYearMonth('')).toBeNull();
  });
});

describe('monthRange', () => {
  it('returns a half-open local month window', () => {
    const { start, end } = monthRange({ year: 2026, month: 9 });
    expect(start).toEqual(new Date(2026, 8, 1));
    expect(end).toEqual(new Date(2026, 9, 1));
  });
});

describe('shiftYearMonth', () => {
  it('wraps across year boundaries', () => {
    expect(shiftYearMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftYearMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });
});

describe('formatYearMonth', () => {
  it('pads the month', () => {
    expect(formatYearMonth({ year: 2026, month: 9 })).toBe('2026-09');
  });
});

describe('currentYearMonth', () => {
  it('reads year and 1-based month from the given date', () => {
    expect(currentYearMonth(new Date(2026, 8, 15))).toEqual({ year: 2026, month: 9 });
  });
});
