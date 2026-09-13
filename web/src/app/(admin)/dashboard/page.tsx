'use client';

import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { useProjects } from '@/lib/hooks/use-projects';
import { StatCard } from '@/components/admin/stat-card';
import { ProgressRing } from '@/components/shared/progress-ring';
import { StatusPill, HealthPill } from '@/components/shared/pills';
import { formatShortDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CenteredLoader, ErrorState, EmptyState } from '@/components/shared/states';

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useProjects({ limit: 100 });

  if (isLoading) return <CenteredLoader label="Loading dashboard" />;
  if (isError) return <ErrorState description={error?.message} onRetry={() => refetch()} />;

  const projects = data?.projects ?? [];
  const active = projects.filter((p) => p.status !== 'COMPLETED' && p.status !== 'ARCHIVED' && p.status !== 'CANCELLED');
  const atRisk = projects.filter((p) => p.health === 'AT_RISK' || p.health === 'DELAYED');
  const paused = projects.filter((p) => p.status === 'PAUSED');
  const avgProgress = projects.length
    ? Math.round(projects.reduce((acc, p) => acc + p.progressPercentage, 0) / projects.length)
    : 0;

  const recentlyUpdated = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  ).slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-brand/70">live pulse</p>
          <h1 className="text-glow mt-1 font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">A live pulse of every project in the studio.</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus />
            New project
          </Button>
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active projects" value={active.length} accent="brand" hint={`of ${projects.length} total`} />
        <StatCard label="Average progress" value={`${avgProgress}%`} hint="across all projects" />
        <StatCard label="At risk / delayed" value={atRisk.length} accent={atRisk.length ? 'danger' : 'success'} />
        <StatCard label="Paused" value={paused.length} accent="amber" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Recently updated
          </h2>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand underline-offset-2 hover:underline"
          >
            All projects <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {recentlyUpdated.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start tracking progress for a client."
            action={
              <Link href="/projects/new">
                <Button variant="soft" size="sm">
                  <Plus /> Create project
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col divide-y divide-white/[0.06] overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
            {recentlyUpdated.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.04]"
              >
                <ProgressRing value={p.progressPercentage} size={44} stroke={4} labelClassName="!text-[9px]" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-display text-sm font-semibold">
                    <span className="truncate">{p.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-500">{p.projectCode}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    ETA {formatShortDate(p.currentEstimatedCompletionDate)} · {p.currentEstimatedDuration}d
                  </p>
                </div>
                <div className="hidden gap-2 sm:flex">
                  <StatusPill status={p.status} />
                  <HealthPill health={p.health} />
                </div>
                <ArrowRight className="size-4 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}