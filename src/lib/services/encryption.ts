import crypto from 'crypto';

/**
 * AES-256-GCM secret encryption (SOP-05).
 * Key material is VELADESK_MASTER_KEY + tenantId via PBKDF2 — never store the master key in the DB.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;

export function assertMasterKeyPresent(): void {
  if (!process.env.VELADESK_MASTER_KEY) {
    throw new Error('CRITICAL SECURITY ERROR: VELADESK_MASTER_KEY is not set');
  }
}

function getMasterKey(): string {
  assertMasterKeyPresent();
  return process.env.VELADESK_MASTER_KEY as string;
}

function deriveKey(tenantId: string, salt: Buffer): Buffer {
  const password = `${getMasterKey()}:${tenantId}`;
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

export function encryptSecret(plaintext: string, tenantId: string): string {
  if (!plaintext) return '';
  if (!tenantId) throw new Error('encryptSecret execution blocked: tenantId is required for key derivation.');

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(tenantId, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return Buffer.from(
    `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  ).toString('base64');
}

export function decryptSecret(encryptedPayload: string, tenantId: string): string {
  if (!encryptedPayload) return '';
  if (!tenantId) throw new Error('decryptSecret execution blocked: tenantId is required for key derivation.');

  try {
    const decodedPayload = Buffer.from(encryptedPayload, 'base64').toString('utf8');
    const parts = decodedPayload.split(':');

    if (parts.length !== 4) {
      throw new Error('Invalid encrypted payload structure.');
    }

    const [saltHex, ivHex, authTagHex, encryptedHex] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = deriveKey(tenantId, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error. Check tenantId.';
    throw new Error(`Decryption failed: ${message}`);
  }
}
