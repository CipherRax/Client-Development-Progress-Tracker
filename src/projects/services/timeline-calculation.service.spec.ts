import { TimelineCalculationService } from './timeline-calculation.service';

describe('TimelineCalculationService', () => {
  let service: TimelineCalculationService;

  beforeEach(() => {
    service = new TimelineCalculationService();
  });

  it('returns the original completion date when no extra time has accrued', () => {
    const result = service.recalculate({
      originalEstimatedCompletionDate: new Date('2026-09-10T00:00:00.000Z'),
      originalEstimatedDuration: 40,
      additionalTimeDays: 0,
      pausedTimeDays: 0,
    });
    expect(result.currentEstimatedCompletionDate.toISOString().slice(0, 10)).toBe('2026-09-10');
    expect(result.currentEstimatedDuration).toBe(40);
  });

  it('adds approved change-request days and paused days to the original estimate', () => {
    // Original completion: September 10. +3 days change request, +2 days paused.
    const result = service.recalculate({
      originalEstimatedCompletionDate: new Date('2026-09-10T00:00:00.000Z'),
      originalEstimatedDuration: 40,
      additionalTimeDays: 3,
      pausedTimeDays: 2,
    });
    expect(result.currentEstimatedCompletionDate.toISOString().slice(0, 10)).toBe('2026-09-15');
    expect(result.currentEstimatedDuration).toBe(45);
  });

  it('never mutates or loses the original estimate — it is always the base of the calculation', () => {
    const original = new Date('2026-01-01T00:00:00.000Z');
    const untouchedCopy = new Date(original);
    service.recalculate({
      originalEstimatedCompletionDate: original,
      originalEstimatedDuration: 10,
      additionalTimeDays: 5,
      pausedTimeDays: 5,
    });
    expect(original.getTime()).toBe(untouchedCopy.getTime());
  });

  it('estimatedDaysRemaining never goes negative', () => {
    const pastDate = new Date();
    pastDate.setUTCDate(pastDate.getUTCDate() - 10);
    expect(service.estimatedDaysRemaining(pastDate)).toBe(0);
  });
});
