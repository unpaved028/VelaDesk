import { describe, expect, it } from 'vitest';
import { matchEmailPattern } from './emailPattern';

describe('matchEmailPattern', () => {
  it('matches an exact address case-insensitively', () => {
    expect(matchEmailPattern('Help@Acme.com', 'help@acme.com')).toBe(true);
  });

  it('matches *@domain.com', () => {
    expect(matchEmailPattern('*@acme.com', 'alice@acme.com')).toBe(true);
    expect(matchEmailPattern('*@acme.com', 'alice@other.com')).toBe(false);
  });

  it('matches user@*', () => {
    expect(matchEmailPattern('alerts@*', 'alerts@monitor.local')).toBe(true);
    expect(matchEmailPattern('alerts@*', 'other@monitor.local')).toBe(false);
  });

  it('does not treat unmatched substrings as hits', () => {
    expect(matchEmailPattern('support@acme.com', 'not-support@acme.com')).toBe(false);
  });
});
