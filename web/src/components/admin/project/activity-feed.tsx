'use client';

import { Activity } from 'lucide-react';
import { useActivity } from '@/lib/hooks/use-misc';
import type { ProjectActivity } from '@/lib/api/types';
import { Spinner } from '@/components/ui/skeleton';
import { formatLedgerDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

function actorColor(actorType: ProjectActivity['actorType']) {
  switch (actorType) {
    case 'ADMIN':
      return 'bg-brand text-white';
    case 'CLIENT':
      return 'bg-amber text-ink';
    default:
      return 'bg-zinc-400 text-white';
  }
}

export function ActivityFeed({ projectId }: { projectId: string }) {
  const { data, isLoading } = useActivity(projectId);

  if (isLoading) return <Spinner className="mx-auto my-6" />;

  const activities = data?.activities ?? [];

  if (activities.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line px-6 py-10 text-center text-sm text-ink/50 dark:text-zinc-500">
        No activity recorded for this project yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-line pl-5">
      {activities.map((a) => (
        <li key={a.id} className="relative pb-5">
          <span className={cn('absolute -left-[27px] top-1 flex size-3 items-center justify-center rounded-full ring-2 ring-paper dark:ring-canvas', actorColor(a.actorType))} aria-hidden />
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium">{a.description}</p>
            <p className="shrink-0 text-xs text-ink/40 dark:text-zinc-500">{formatLedgerDate(a.createdAt)}</p>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink/40 dark:text-zinc-500">
            <Activity className="size-3" /> {a.eventType.replace(/_/g, ' ')}
          </p>
        </li>
      ))}
    </ol>
  );
}