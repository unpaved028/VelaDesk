import crypto from 'crypto';

/**
 * Der Master Key muss in der Server-Umgebung vorliegen.
 * Er sollte idealerweise mindestens 32 Zeichen (oder Base64 encodiert) sein.
 */
const MASTER_KEY = process.env.VELADESK_MASTER_KEY;

if (!MASTER_KEY) {
  // Fail-fast according to SOP-05
  throw new Error('CRITICAL SECURITY ERROR: VELADESK_MASTER_KEY is not set in environment variables.');
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;

/**
 * Leitet einen 32-Byte (256-bit) Schlüssel aus dem MasterKey und der tenantId ab.
 * So stellen wir sicher, dass Mandant A niemals die Secrets von Mandant B entschlüsseln kann,
 * selbst wenn wir eine Schwachstelle hätten.
 */
function deriveKey(tenantId: string, salt: Buffer): Buffer {
  // PBKDF2 wird genutzt, um einen 32-Byte Key sicher zu generieren.
  // MASTER_KEY + tenantId als kombiniertes Passwort.
  const password = `${MASTER_KEY}:${tenantId}`;
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * Verschlüsselt einen String gemäß SOP-05 (aes-256-gcm, Tenant-Isolation).
 * 
 * @param plaintext Der zu verschlüsselnde Klartext
 * @param tenantId  Die ID des Tenants, dem das Secret gehört
 * @returns Ein kodierter String (Base64) im Format: salt:iv:authTag:encryptedData
 */
export function encryptSecret(plaintext: string, tenantId: string): string {
  if (!plaintext) return '';
  if (!tenantId) throw new Error('encryptSecret execution blocked: tenantId is required for key derivation.');

  // Generate random salt and initialization vector
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive tenant-specific key
  const key = deriveKey(tenantId, salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the plain text
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Request the auth tag
  const authTag = cipher.getAuthTag();

  // Return the complete payload combined and base64 encoded for safe DB storage
  // Format: salt:iv:authTag:encryptedData
  return Buffer.from(
    `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  ).toString('base64');
}

/**
 * Entschlüsselt ein Secret gemäß SOP-05.
 * 
 * @param encryptedPayload Der aus der DB gelesene Payload (Base64 kodiert, erzeugt von encryptSecret)
 * @param tenantId Die dazugehörige tenantId, um den korrekten Schlüssel abzuleiten
 * @returns Der entschlüsselte Klartext
 */
export function decryptSecret(encryptedPayload: string, tenantId: string): string {
  if (!encryptedPayload) return '';
  if (!tenantId) throw new Error('decryptSecret execution blocked: tenantId is required for key derivation.');

  try {
    // Decode base64 
    const decodedPayload = Buffer.from(encryptedPayload, 'base64').toString('utf8');
    const parts = decodedPayload.split(':');

    if (parts.length !== 4) {
      throw new Error('Invalid encrypted payload structure.');
    }

    const [saltHex, ivHex, authTagHex, encryptedHex] = parts;

    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Derive the same key used for encryption
    const key = deriveKey(tenantId, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    throw new Error(`Decryption failed: ${error.message || 'Unknown error. Check tenantId.'}`);
  }
}
