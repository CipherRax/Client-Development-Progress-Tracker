'use client';

import { CalendarClock, Flag, Gauge, Hammer, Users } from 'lucide-react';
import type { ProjectDetail } from '@/lib/api/types';
import { ProgressRing } from '@/components/shared/progress-ring';
import { StatusPill, HealthPill } from '@/components/shared/pills';
import { EstimateTimeline } from './estimate-timeline';
import { StatusControls } from './status-controls';
import { formatLedgerDate } from '@/lib/utils';
import { useChangeRequests } from '@/lib/hooks/use-change-requests';

export function ProjectOverview({ project }: { project: ProjectDetail }) {
  const { data: changeRequests } = useChangeRequests(project.id);
  const approvedChangeRequests =
    changeRequests?.filter((cr) => cr.status === 'APPROVED' && cr.approvedAt) ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Progress banner */}
      <div className="flex flex-wrap items-center gap-6 rounded-md border border-line bg-white p-6 dark:bg-panel">
        <ProgressRing value={project.progressPercentage} size={110} stroke={9} labelClassName="!text-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold tracking-tight">{project.name}</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 dark:text-zinc-500">
              {project.projectCode}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status={project.status} />
            <HealthPill health={project.health} />
          </div>
          {project.client && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/60 dark:text-zinc-400">
              <Users className="size-3.5" /> {project.client.name}
              {project.client.companyName ? ` · ${project.client.companyName}` : ''}
            </p>
          )}
          {project.description && (
            <p className="mt-2 max-w-prose text-sm text-ink/70 dark:text-zinc-300">{project.description}</p>
          )}
          {project.progressManualOverride && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber">
              <Gauge className="size-3.5" /> Progress is manually overridden (auto-calc suspended).
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <StatusControls project={project} />

      {/* Estimate timeline */}
      <div className="rounded-md border border-line bg-white p-6 dark:bg-panel">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="size-4 text-brand" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink/60 dark:text-zinc-400">
            How the deadline moved
          </h3>
        </div>
        <EstimateTimeline
          startDate={project.startDate}
          originalCompletionDate={project.originalEstimatedCompletionDate}
          currentCompletionDate={project.currentEstimatedCompletionDate}
          approvedChangeRequests={approvedChangeRequests}
        />
        <p className="mt-3 text-xs text-ink/40 dark:text-zinc-600">
          {project.pausedTimeDays > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Flag className="size-3" /> Paused {project.pausedTimeDays} day{project.pausedTimeDays === 1 ? '' : 's'} total.
            </span>
          )}{' '}
          {project.additionalTimeDays > 0 && (
            <span className="inline-flex items-center gap-1.5">
              ETA extended by {project.additionalTimeDays} day{project.additionalTimeDays === 1 ? '' : 's'} across{' '}
              {project.changeRequestSummary?.approved ?? 0} approved change request
              {project.changeRequestSummary?.approved === 1 ? '' : 's'}.
            </span>
          )}
        </p>
      </div>

      {/* Key facts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Start date" value={formatLedgerDate(project.startDate)} />
        <Fact label="Baseline estimate" value={formatLedgerDate(project.originalEstimatedCompletionDate)} sub="original contract" />
        <Fact label="Current estimate" value={formatLedgerDate(project.currentEstimatedCompletionDate)} sub={`${project.currentEstimatedDuration} days total`} />
        <Fact label="Estimated days remaining" value={String(project.estimatedDaysRemaining ?? '—')} sub="from today" mono />
        <Fact label="Current / next milestone" value={project.currentMilestone?.title ?? '—'} sub={project.nextMilestone ? `next: ${project.nextMilestone.title}` : 'no next milestone'} />
        <Fact label="Change requests" value={String(project.changeRequestSummary?.total ?? 0)} sub={`${project.changeRequestSummary?.pending ?? 0} pending`} mono />
      </div>

      {project.currentWork && project.currentWork.length > 0 && (
        <div className="rounded-md border border-line bg-white p-6 dark:bg-panel">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-ink/60 dark:text-zinc-400">
            <Hammer className="size-4 text-brand" /> Focus right now
          </h3>
          <ul className="space-y-2">
            {project.currentWork.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{w.title}</span>
                {w.expectedCompletionDate && (
                  <span className="font-mono text-xs text-ink/50 dark:text-zinc-500">
                    {formatLedgerDate(w.expectedCompletionDate)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Fact({
  label,
  value,
  sub,
  mono,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-line bg-white p-4 dark:bg-panel">
      <p className="text-xs uppercase tracking-wide text-ink/50 dark:text-zinc-500">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${mono ? 'font-mono' : 'font-display'}`}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-ink/45 dark:text-zinc-500">{sub}</p>}
    </div>
  );
}