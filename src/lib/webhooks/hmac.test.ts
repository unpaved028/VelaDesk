import { describe, expect, it } from 'vitest';
import { signWebhookPayload, verifyWebhookSignature } from './hmac';

describe('webhook HMAC', () => {
  it('signs a payload with SHA-256 hex', () => {
    const sig = signWebhookPayload('{"id":1}', 'secret');
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyWebhookSignature('{"id":1}', 'secret', sig)).toBe(true);
  });

  it('rejects a wrong secret or payload', () => {
    const sig = signWebhookPayload('{"id":1}', 'secret');
    expect(verifyWebhookSignature('{"id":1}', 'other', sig)).toBe(false);
    expect(verifyWebhookSignature('{"id":2}', 'secret', sig)).toBe(false);
    expect(verifyWebhookSignature('{"id":1}', 'secret', 'deadbeef')).toBe(false);
  });
});
