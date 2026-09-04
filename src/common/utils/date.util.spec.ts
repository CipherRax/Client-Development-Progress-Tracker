import { addDaysUtc, diffInDaysUtc, daysRemainingFrom } from './date.util';

describe('date.util', () => {
  it('addDaysUtc adds whole days without DST drift', () => {
    const start = new Date('2026-08-01T00:00:00.000Z');
    const result = addDaysUtc(start, 60);
    expect(result.toISOString().slice(0, 10)).toBe('2026-09-30');
  });

  it('diffInDaysUtc computes the day gap between two dates', () => {
    const from = new Date('2026-08-01T00:00:00.000Z');
    const to = new Date('2026-10-01T00:00:00.000Z');
    expect(diffInDaysUtc(from, to)).toBe(61);
  });

  it('diffInDaysUtc ignores time-of-day components', () => {
    const from = new Date('2026-08-01T23:59:00.000Z');
    const to = new Date('2026-08-02T00:01:00.000Z');
    expect(diffInDaysUtc(from, to)).toBe(1);
  });

  it('daysRemainingFrom clamps to zero for past dates', () => {
    const today = new Date('2026-08-27T00:00:00.000Z');
    const past = new Date('2026-08-01T00:00:00.000Z');
    expect(daysRemainingFrom(today, past)).toBe(0);
  });

  it('daysRemainingFrom returns the correct positive gap', () => {
    const today = new Date('2026-08-27T00:00:00.000Z');
    const future = new Date('2026-09-06T00:00:00.000Z');
    expect(daysRemainingFrom(today, future)).toBe(10);
  });
});
