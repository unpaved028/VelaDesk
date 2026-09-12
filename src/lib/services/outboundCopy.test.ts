import { describe, expect, it } from 'vitest';
import {
  csatSubject,
  magicLinkSubject,
  publicReplySubject,
  ticketAckHtml,
  ticketAckSubject,
} from './outboundCopy';
import { normalizeLocale } from './tenantFacing';

const de = { brandName: 'Nordlicht IT', locale: 'de' as const, hasLogo: false };
const en = { brandName: 'Northlight IT', locale: 'en' as const, hasLogo: false };

describe('normalizeLocale', () => {
  it('accepts en and falls back to de', () => {
    expect(normalizeLocale('en')).toBe('en');
    expect(normalizeLocale('de')).toBe('de');
    expect(normalizeLocale('fr')).toBe('de');
    expect(normalizeLocale(undefined)).toBe('de');
  });
});

describe('outboundCopy', () => {
  it('keeps the ticket token and uses the tenant brand', () => {
    expect(ticketAckSubject(4, de)).toBe('[#TK-4] Ihre Anfrage ist eingegangen');
    expect(ticketAckSubject(4, en)).toBe('[#TK-4] We received your request');
    expect(magicLinkSubject(de)).toBe('Ihr Nordlicht IT-Anmeldelink');
    expect(magicLinkSubject(en)).toBe('Your Northlight IT sign-in link');
    expect(publicReplySubject(1, en)).toBe('[#TK-1] New update on your request');
    expect(csatSubject(9, en)).toBe('[#TK-9] How was your experience?');
    expect(ticketAckHtml(2, 'VPN down', de)).toContain('Nordlicht IT');
    expect(ticketAckHtml(2, 'VPN down', de)).not.toContain('VelaDesk');
  });
});
