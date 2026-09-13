import { describe, expect, it } from 'vitest';
import { PROJECT_STATUS_META, HEALTH_META, isTerminal } from '@/lib/presentation';

describe('presentation metadata', () => {
  it('provides a color + icon + label pair for every project status', () => {
    expect(Object.keys(PROJECT_STATUS_META)).toHaveLength(14);
    for (const meta of Object.values(PROJECT_STATUS_META)) {
      expect(meta.className).toBeTruthy();
      expect(meta.label).toBeTruthy();
      expect(meta.Icon).toBeTruthy();
    }
  });

  it('provides a label for every health state', () => {
    expect(HEALTH_META.ON_TRACK.label).toBe('On Track');
  });

  it('classifies terminal statuses correctly', () => {
    expect(isTerminal('COMPLETED')).toBe(true);
    expect(isTerminal('CANCELLED')).toBe(true);
    expect(isTerminal('ARCHIVED')).toBe(true);
    expect(isTerminal('IN_PROGRESS')).toBe(false);
  });
});