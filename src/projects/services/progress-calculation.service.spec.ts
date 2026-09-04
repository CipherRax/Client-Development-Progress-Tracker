import { ProgressCalculationService } from './progress-calculation.service';

// Prisma string enums serialize to their member name (e.g. TaskStatus.COMPLETED === 'COMPLETED'),
// so these tests use the literal strings directly to avoid depending on a generated client.
const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  BLOCKED: 'BLOCKED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

describe('ProgressCalculationService', () => {
  let service: ProgressCalculationService;

  beforeEach(() => {
    service = new ProgressCalculationService();
  });

  describe('calculateMilestoneProgress', () => {
    it('returns the fallback value when there are no tasks', () => {
      expect(service.calculateMilestoneProgress([], 42)).toBe(42);
    });

    it('excludes cancelled tasks from the denominator', () => {
      const tasks = [
        { status: TaskStatus.COMPLETED },
        { status: TaskStatus.COMPLETED },
        { status: TaskStatus.CANCELLED },
      ];
      expect(service.calculateMilestoneProgress(tasks, 0)).toBe(100);
    });

    it('computes completed/total as a percentage', () => {
      const tasks = [
        { status: TaskStatus.COMPLETED },
        { status: TaskStatus.TODO },
        { status: TaskStatus.IN_PROGRESS },
        { status: TaskStatus.TODO },
      ];
      expect(service.calculateMilestoneProgress(tasks, 0)).toBe(25);
    });

    it('never returns a value outside [0, 100]', () => {
      expect(service.calculateMilestoneProgress([], -50)).toBe(0);
      expect(service.calculateMilestoneProgress([], 500)).toBe(100);
    });
  });

  describe('calculateProjectProgress', () => {
    it('returns 0 for a project with no milestones', () => {
      expect(service.calculateProjectProgress([])).toBe(0);
    });

    it('computes a weighted average when weights are assigned', () => {
      const milestones = [
        { id: '1', weight: 50, progressPercentage: 100, status: 'COMPLETED' },
        { id: '2', weight: 50, progressPercentage: 0, status: 'PENDING' },
      ];
      expect(service.calculateProjectProgress(milestones)).toBe(50);
    });

    it('falls back to an equal-weight average when no weights are set', () => {
      const milestones = [
        { id: '1', weight: 0, progressPercentage: 100, status: 'COMPLETED' },
        { id: '2', weight: 0, progressPercentage: 0, status: 'PENDING' },
      ];
      expect(service.calculateProjectProgress(milestones)).toBe(50);
    });

    it('never exceeds 100 even with rounding', () => {
      const milestones = [
        { id: '1', weight: 33, progressPercentage: 100, status: 'COMPLETED' },
        { id: '2', weight: 33, progressPercentage: 100, status: 'COMPLETED' },
        { id: '3', weight: 34, progressPercentage: 100, status: 'COMPLETED' },
      ];
      expect(service.calculateProjectProgress(milestones)).toBe(100);
    });
  });

  describe('findCurrentMilestone / findNextMilestone', () => {
    const milestones = [
      { order: 0, status: 'COMPLETED' },
      { order: 1, status: 'IN_PROGRESS' },
      { order: 2, status: 'PENDING' },
      { order: 3, status: 'PENDING' },
    ];

    it('finds the first IN_PROGRESS milestone as current', () => {
      expect(service.findCurrentMilestone(milestones)?.order).toBe(1);
    });

    it('falls back to the first PENDING milestone when none is in progress', () => {
      const noInProgress = [
        { order: 0, status: 'COMPLETED' },
        { order: 1, status: 'PENDING' },
      ];
      expect(service.findCurrentMilestone(noInProgress)?.order).toBe(1);
    });

    it('returns null when every milestone is completed', () => {
      const allDone = [{ order: 0, status: 'COMPLETED' }];
      expect(service.findCurrentMilestone(allDone)).toBeNull();
    });

    it('finds the next pending milestone after the current one', () => {
      const current = service.findCurrentMilestone(milestones);
      expect(service.findNextMilestone(milestones, current)?.order).toBe(2);
    });
  });
});
