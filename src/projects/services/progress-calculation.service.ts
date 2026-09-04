import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';

export interface MilestoneForProgress {
  id: string;
  weight: number;
  progressPercentage: number;
  status: string;
}

export interface TaskForProgress {
  status: TaskStatus;
}

@Injectable()
export class ProgressCalculationService {
  /**
   * Derives a milestone's progress percentage from its tasks.
   * If the milestone has no tasks, its manually-set/current progress is kept.
   * CANCELLED tasks are excluded from the denominator (they don't represent
   * remaining scope), COMPLETED tasks count toward the numerator.
   */
  calculateMilestoneProgress(tasks: TaskForProgress[], fallback: number): number {
    const relevant = tasks.filter((t) => t.status !== TaskStatus.CANCELLED);
    if (relevant.length === 0) {
      return this.clamp(fallback);
    }
    const completed = relevant.filter((t) => t.status === TaskStatus.COMPLETED).length;
    return this.clamp((completed / relevant.length) * 100);
  }

  /**
   * Derives overall project progress from milestone weights.
   * Falls back to an equal-weight average when no weights have been assigned
   * (i.e. all weights are 0), so the calculation never silently returns 0.
   */
  calculateProjectProgress(milestones: MilestoneForProgress[]): number {
    if (milestones.length === 0) {
      return 0;
    }

    const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 0), 0);

    if (totalWeight > 0) {
      const weighted = milestones.reduce(
        (sum, m) => sum + (m.weight / totalWeight) * m.progressPercentage,
        0,
      );
      return this.clamp(weighted);
    }

    // No weights configured: treat every milestone equally.
    const equalAverage =
      milestones.reduce((sum, m) => sum + m.progressPercentage, 0) / milestones.length;
    return this.clamp(equalAverage);
  }

  /**
   * Determines the current active milestone: the first IN_PROGRESS milestone
   * by order. If none is in progress, returns the next PENDING milestone.
   */
  findCurrentMilestone<T extends { order: number; status: string }>(
    milestones: T[],
  ): T | null {
    const sorted = [...milestones].sort((a, b) => a.order - b.order);
    const inProgress = sorted.find((m) => m.status === 'IN_PROGRESS');
    if (inProgress) {
      return inProgress;
    }
    return sorted.find((m) => m.status === 'PENDING') ?? null;
  }

  findNextMilestone<T extends { order: number; status: string }>(
    milestones: T[],
    current: T | null,
  ): T | null {
    const sorted = [...milestones].sort((a, b) => a.order - b.order);
    const pending = sorted.filter((m) => m.status === 'PENDING' || m.status === 'BLOCKED');
    if (!current) {
      return pending[0] ?? null;
    }
    return pending.find((m) => m.order > current.order) ?? pending[0] ?? null;
  }

  private clamp(value: number): number {
    if (Number.isNaN(value)) return 0;
    return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
  }
}
