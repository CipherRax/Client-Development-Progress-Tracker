'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useProjects } from '@/lib/hooks/use-projects';
import type { ProjectHealth, ProjectStatus } from '@/lib/api/types';
import { PROJECT_STATUSES } from '@/lib/validation/enums';
import { StatusPill, HealthPill } from '@/components/shared/pills';
import { ProgressRing } from '@/components/shared/progress-ring';
import { formatShortDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Pagination } from '@/components/shared/pagination';
import { LoadingRows, ErrorState, EmptyState } from '@/components/shared/states';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [health, setHealth] = useState<ProjectHealth | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useProjects({
    search: search || undefined,
    status: status || undefined,
    health: health || undefined,
    page,
    limit: 12,
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-ink/60 dark:text-zinc-400">Track progress, health and estimates.</p>
        </div>
        <Link href="/projects/new">
          <Button><Plus /> New project</Button>
        </Link>
      </header>

      <div className="grid gap-3 md:grid-cols-[1fr_200px_180px]">
        <Input placeholder="Search by name or code…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <Select value={status} onChange={(e) => { setStatus(e.target.value as ProjectStatus | ''); setPage(1); }} aria-label="Filter by status">
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={health} onChange={(e) => { setHealth(e.target.value as ProjectHealth | ''); setPage(1); }} aria-label="Filter by health">
          <option value="">All health</option>
          <option value="ON_TRACK">On Track</option>
          <option value="AT_RISK">At Risk</option>
          <option value="DELAYED">Delayed</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-white dark:bg-panel">
        {isLoading && <LoadingRows rows={8} />}
        {isError && <ErrorState description={error?.message} onRetry={() => refetch()} />}
        {data && data.projects.length === 0 && (
          <EmptyState
            title="No projects match"
            description="Adjust your filters, or create a new project to get started."
            action={
              <Link href="/projects/new"><Button variant="soft" size="sm"><Plus /> New project</Button></Link>
            }
          />
        )}
        <div className="flex flex-col divide-y divide-line">
          {data?.projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
              <ProgressRing value={p.progressPercentage} size={44} stroke={4} labelClassName="!text-[9px]" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-display text-sm font-semibold">
                  <span className="truncate">{p.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-ink/40 dark:text-zinc-500">{p.projectCode}</span>
                </p>
                <p className="mt-0.5 text-xs text-ink/50 dark:text-zinc-500">
                  Started {formatShortDate(p.startDate)} · ETA {formatShortDate(p.currentEstimatedCompletionDate)}
                </p>
              </div>
              <div className="hidden gap-2 md:flex">
                <StatusPill status={p.status} />
                <HealthPill health={p.health} />
              </div>
            </Link>
          ))}
        </div>
        <Pagination page={page} totalPages={data?.meta.totalPages ?? 1} total={data?.meta.total} onPageChange={setPage} />
      </div>
    </div>
  );
}