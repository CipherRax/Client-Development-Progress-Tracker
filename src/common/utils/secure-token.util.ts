import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/**
 * Generates a high-entropy, URL-safe random token.
 * 32 bytes = 256 bits of entropy, base64url encoded (~43 chars).
 * Suitable for use as a client-access credential or refresh token.
 */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Hashes a token using SHA-256 for storage. We only ever store the hash;
 * the raw token is shown to the admin once and never persisted.
 * SHA-256 is appropriate here (not bcrypt/argon2) because the input already
 * has 256 bits of entropy — it is not a low-entropy human password subject
 * to brute force, so a fast deterministic hash used for equality lookup is
 * the correct and standard approach (same principle used for API keys).
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time comparison of two hex-encoded hash strings to avoid
 * timing side-channel attacks when validating tokens.
 */
export function safeCompareHashes(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
