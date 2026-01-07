import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment variable
 * Must be exactly 32 characters for AES-256
 */
function getEncryptionKey(): string {
  const key = process.env.SQUARE_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('SQUARE_ENCRYPTION_KEY environment variable is not set');
  }

  if (key.length !== 32) {
    throw new Error('SQUARE_ENCRYPTION_KEY must be exactly 32 characters');
  }

  return key;
}

/**
 * Encrypt a token using AES-256-GCM
 * Returns encrypted string in format: iv:authTag:encryptedData
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a token that was encrypted with encryptToken
 * Expects format: iv:authTag:encryptedData
 */
export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();

  const parts = encryptedToken.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivHex, authTagHex, encryptedData] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
