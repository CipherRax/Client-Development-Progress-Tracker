const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parses durations such as "15m", "7d", "1h", "30s" into milliseconds.
 * Falls back to interpreting a bare number as milliseconds.
 */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(value.trim());
  if (!match) {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber)) {
      return asNumber;
    }
    throw new Error(`Invalid duration string: ${value}`);
  }
  const [, amountStr, unit] = match;
  return Number(amountStr) * UNIT_MS[unit.toLowerCase()];
}
