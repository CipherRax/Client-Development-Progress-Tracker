import { parseDurationMs } from './duration.util';

describe('parseDurationMs', () => {
  it('parses seconds, minutes, hours, and days', () => {
    expect(parseDurationMs('30s')).toBe(30 * 1000);
    expect(parseDurationMs('15m')).toBe(15 * 60 * 1000);
    expect(parseDurationMs('2h')).toBe(2 * 60 * 60 * 1000);
    expect(parseDurationMs('7d')).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('is case-insensitive', () => {
    expect(parseDurationMs('7D')).toBe(parseDurationMs('7d'));
  });

  it('treats a bare number as milliseconds', () => {
    expect(parseDurationMs('5000')).toBe(5000);
  });

  it('throws on a genuinely invalid string', () => {
    expect(() => parseDurationMs('not-a-duration')).toThrow();
  });
});
