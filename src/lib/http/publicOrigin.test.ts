import { describe, expect, it } from 'vitest';
import { isUnspecifiedBindHost, publicAbsoluteUrl, publicRequestOrigin } from './publicOrigin';

function req(url: string, headers: Record<string, string>) {
  return {
    url,
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
  };
}

describe('isUnspecifiedBindHost', () => {
  it('detects IPv4 and IPv6 unspecified addresses', () => {
    expect(isUnspecifiedBindHost('0.0.0.0:3000')).toBe(true);
    expect(isUnspecifiedBindHost('[::]:3000')).toBe(true);
  });

  it('allows real hostnames and loopback', () => {
    expect(isUnspecifiedBindHost('pi.local:3000')).toBe(false);
    expect(isUnspecifiedBindHost('127.0.0.1:3000')).toBe(false);
  });
});

describe('publicRequestOrigin', () => {
  it('uses the Host header when request.url is the Docker bind address', () => {
    expect(
      publicRequestOrigin(
        req('http://0.0.0.0:3000/api/auth/portal/verify?token=abc', {
          host: 'pi.local:3000',
        })
      )
    ).toBe('http://pi.local:3000');
  });

  it('prefers forwarded proto and host (reverse proxy)', () => {
    expect(
      publicRequestOrigin(
        req('http://0.0.0.0:3000/admin', {
          host: '0.0.0.0:3000',
          'x-forwarded-host': 'veladesk.example.com',
          'x-forwarded-proto': 'https',
        })
      )
    ).toBe('https://veladesk.example.com');
  });
});

describe('publicAbsoluteUrl', () => {
  it('keeps the public host on post-login redirects', () => {
    expect(
      publicAbsoluteUrl(
        req('http://0.0.0.0:3000/api/auth/portal/verify?token=abc', {
          host: 'pi.local:3000',
        }),
        '/admin'
      ).href
    ).toBe('http://pi.local:3000/admin');
  });
});
