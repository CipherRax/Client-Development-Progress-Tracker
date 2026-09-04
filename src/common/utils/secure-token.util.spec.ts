import { generateSecureToken, hashToken, safeCompareHashes } from './secure-token.util';

describe('secure-token.util', () => {
  it('generates high-entropy, unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateSecureToken()));
    expect(tokens.size).toBe(100);
  });

  it('generated tokens are not predictable/sequential', () => {
    const a = generateSecureToken();
    const b = generateSecureToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });

  it('hashes the same token deterministically', () => {
    const token = generateSecureToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('produces different hashes for different tokens', () => {
    const a = hashToken(generateSecureToken());
    const b = hashToken(generateSecureToken());
    expect(a).not.toBe(b);
  });

  it('safeCompareHashes returns true only for identical hashes', () => {
    const hash = hashToken('some-token');
    expect(safeCompareHashes(hash, hash)).toBe(true);
    expect(safeCompareHashes(hash, hashToken('different-token'))).toBe(false);
  });

  it('safeCompareHashes handles length mismatches without throwing', () => {
    expect(safeCompareHashes('ab', 'abcd')).toBe(false);
  });
});
