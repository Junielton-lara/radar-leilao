import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

export function getCredentialsSecret(): string {
  return (
    process.env.CREDENTIALS_ENCRYPTION_KEY ||
    process.env.JWT_ACCESS_SECRET ||
    'lancex-dev-credentials-key-change-me'
  );
}

/** Encrypts a plaintext API key for storage. Format: iv:tag:ciphertext (hex). */
export function encryptCredential(plaintext: string, secret = getCredentialsSecret()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, deriveKey(secret), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptCredential(
  payload: string,
  secret = getCredentialsSecret(),
): string {
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Invalid credentials payload');
  }
  const decipher = createDecipheriv(ALGO, deriveKey(secret), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

export function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 8) return '****';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
