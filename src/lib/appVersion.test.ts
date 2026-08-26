import { describe, expect, it } from 'vitest';
import { APP_VERSION, isNewer } from './appVersion';

describe('isNewer', () => {
  it('detects a higher patch/minor/major', () => {
    expect(isNewer('0.2.0', '0.1.0')).toBe(true);
    expect(isNewer('1.0.0', '0.9.9')).toBe(true);
    expect(isNewer('0.1.1', '0.1.0')).toBe(true);
  });

  it('is false when versions are equal or code is older', () => {
    expect(isNewer('0.2.0', '0.2.0')).toBe(false);
    expect(isNewer('0.1.0', '0.2.0')).toBe(false);
  });
});

describe('APP_VERSION', () => {
  it('matches package.json (semver string)', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
