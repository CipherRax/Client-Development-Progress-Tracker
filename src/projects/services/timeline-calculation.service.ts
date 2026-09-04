import { Injectable } from '@nestjs/common';
import { addDaysUtc, daysRemainingFrom, startOfTodayUtc } from '../../common/utils/date.util';

export interface TimelineInputs {
  originalEstimatedCompletionDate: Date;
  originalEstimatedDuration: number;
  additionalTimeDays: number;
  pausedTimeDays: number;
}

export interface TimelineResult {
  currentEstimatedCompletionDate: Date;
  currentEstimatedDuration: number;
}

@Injectable()
export class TimelineCalculationService {
  /**
   * The current estimate is always derived from the immutable original
   * estimate plus every approved change request's additional time plus
   * accumulated paused time. Nothing overwrites the original values.
   */
  recalculate(inputs: TimelineInputs): TimelineResult {
    const extraDays = inputs.additionalTimeDays + inputs.pausedTimeDays;
    return {
      currentEstimatedCompletionDate: addDaysUtc(
        inputs.originalEstimatedCompletionDate,
        extraDays,
      ),
      currentEstimatedDuration: inputs.originalEstimatedDuration + extraDays,
    };
  }

  estimatedDaysRemaining(currentEstimatedCompletionDate: Date): number {
    return daysRemainingFrom(startOfTodayUtc(), currentEstimatedCompletionDate);
  }
}
