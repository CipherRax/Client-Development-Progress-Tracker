'use client';

import { CalendarRange, Flag, Milestone as MilestoneIcon } from 'lucide-react';
import { useMemo } from 'react';
import { formatShortDate } from '@/lib/utils';

export interface ChangeRequestPoint {
  title: string;
  approvedAt?: string | null;
  previousCompletionDate?: string | null;
  newCompletionDate?: string | null;
}

/**
 * The signature visual: a true time axis drawn from the project's original
 * baseline estimate to the current estimate, with approved change-requests
 * plotted between them (recreated from real API history). Shows clients and
 * admins exactly how the deadline moved.
 */
export function EstimateTimeline({
  startDate,
  originalCompletionDate,
  currentCompletionDate,
  approvedChangeRequests,
}: {
  startDate: string;
  originalCompletionDate: string;
  currentCompletionDate: string;
  approvedChangeRequests: ChangeRequestPoint[];
}) {
  const { originalPct, currentPct, crPoints, moved, totalGain } = useMemo(() => {
    const start = new Date(startDate).getTime();
    const current = new Date(currentCompletionDate).getTime();
    const original = new Date(originalCompletionDate).getTime();
    const span = Math.max(1, current - start);

    const clamp = (v: number) => Math.min(100, Math.max(0, v));

    const crs = approvedChangeRequests
      .filter((cr) => cr.approvedAt && cr.newCompletionDate)
      .map((cr) => {
        const previous = cr.previousCompletionDate
          ? new Date(cr.previousCompletionDate).getTime()
          : original;
        const gained = cr.newCompletionDate
          ? Math.round(
              (new Date(cr.newCompletionDate).getTime() -
                new Date(cr.previousCompletionDate ?? originalCompletionDate).getTime()) /
                86400000,
            )
          : 0;
        return { title: cr.title, pct: clamp(((previous - start) / span) * 100), gained };
      })
      .sort((a, b) => a.pct - b.pct);

    return {
      originalPct: clamp(((original - start) / span) * 100),
      currentPct: 100,
      crPoints: crs,
      moved: original !== current,
      totalGain: crs.reduce((a, b) => a + b.gained, 0),
    };
  }, [startDate, originalCompletionDate, currentCompletionDate, approvedChangeRequests]);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs text-ink/50 dark:text-zinc-500">
        <span className="inline-flex items-center gap-1.5"><Flag className="size-3" /> Baseline</span>
        <span className="inline-flex items-center gap-1.5"><MilestoneIcon className="size-3" /> Now</span>
      </div>

      {/* Track */}
      <div className="relative h-1.5 w-full rounded-full bg-line">
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink/40 bg-white dark:bg-panel"
          style={{ left: `${originalPct}%` }}
          aria-hidden
        />
        {crPoints.map((cr, i) => (
          <div
            key={`${cr.title}-${i}`}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${cr.pct}%` }}
            title={`${cr.title} (+${cr.gained}d)`}
          >
            <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-amber bg-amber/20">
              <CalendarRange className="size-2.5 text-amber" />
            </div>
          </div>
        ))}
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-brand"
          style={{ left: `${currentPct}%` }}
          aria-hidden
        />
      </div>

      {/* Labels */}
      <div className="mt-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium">Original ETA</p>
          <p className="font-mono text-sm font-semibold font-mono-num">{formatShortDate(originalCompletionDate)}</p>
        </div>
        {moved && (
          <div className="text-right">
            <p className="text-xs font-medium text-amber">Current ETA{totalGain > 0 ? ` · +${totalGain}d` : ''}</p>
            <p className="font-mono text-sm font-semibold text-brand font-mono-num">{formatShortDate(currentCompletionDate)}</p>
          </div>
        )}
      </div>

      {crPoints.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-line pt-3">
          {crPoints.map((cr, i) => (
            <li key={`${cr.title}-${i}`} className="flex items-center gap-2 text-xs text-ink/60 dark:text-zinc-400">
              <span className="size-1.5 rounded-full bg-amber" />
              <span className="truncate">{cr.title}</span>
              <span className="ml-auto shrink-0 font-mono text-amber">+{cr.gained}d</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}