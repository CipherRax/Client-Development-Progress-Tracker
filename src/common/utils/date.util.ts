/**
 * All date helpers operate in UTC and on whole-day granularity to avoid
 * timezone/DST drift in duration calculations.
 */

export function addDaysUtc(date: Date, days: number): Date {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function diffInDaysUtc(from: Date, to: Date): number {
  const fromUtc = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const toUtc = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
}

export function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function daysRemainingFrom(today: Date, completionDate: Date): number {
  const remaining = diffInDaysUtc(today, completionDate);
  return Math.max(0, remaining);
}
