'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, LayoutDashboard, ListChecks, GitPullRequest, Mail, Megaphone, Hammer, History } from 'lucide-react';
import Link from 'next/link';
import { useMilestones, useProject } from '@/lib/hooks/use-projects';
import { useChangeRequests } from '@/lib/hooks/use-change-requests';
import { ProjectOverview } from '@/components/admin/project/project-overview';
import { MilestonesPanel } from '@/components/admin/project/milestones-panel';
import { ChangeRequestsPanel } from '@/components/admin/project/change-requests-panel';
import { UpdatesPanel, CurrentWorkPanel } from '@/components/admin/project/updates-work-panels';
import { ClientAccessPanel } from '@/components/admin/project/client-access-panel';
import { ActivityFeed } from '@/components/admin/project/activity-feed';
import { CenteredLoader, ErrorState } from '@/components/shared/states';
import { cn } from '@/lib/utils';

type TabId = 'overview' | 'milestones' | 'change-requests' | 'updates' | 'current-work' | 'client-access' | 'activity';

const TABS: { id: TabId; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'milestones', label: 'Milestones', Icon: ListChecks },
  { id: 'change-requests', label: 'Change requests', Icon: GitPullRequest },
  { id: 'updates', label: 'Updates', Icon: Megaphone },
  { id: 'current-work', label: 'Current work', Icon: Hammer },
  { id: 'client-access', label: 'Client access', Icon: Mail },
  { id: 'activity', label: 'Activity', Icon: History },
];

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const [tab, setTab] = useState<TabId>('overview');

  const changeRequests = useChangeRequests(id);
  const milestones = useMilestones(id);

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/projects" className="inline-flex w-fit items-center gap-1 text-sm text-zinc-400 hover:text-brand">
          <ChevronLeft className="size-4" /> Back to projects
        </Link>
        <ErrorState description={error?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !project) return <CenteredLoader label="Loading project" />;

  const milestoneCount = milestones.data?.length ?? 0;
  const pendingCrCount = changeRequests.data?.filter((c) => c.status === 'PENDING').length ?? 0;

  const tabLabel = (t: TabId) => {
    if (t === 'milestones' && milestoneCount > 0) return `Milestones (${milestoneCount})`;
    if (t === 'change-requests' && pendingCrCount > 0) return `Change requests (${pendingCrCount})`;
    return TABS.find((x) => x.id === t)?.label ?? t;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/projects" className="inline-flex w-fit items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-brand">
          <ChevronLeft className="size-4" /> Back to projects
        </Link>
        <button type="button" onClick={() => router.refresh()} className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500 transition-colors hover:text-brand">
          Refresh
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-xl">
        {TABS.map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === id
                ? 'bg-brand/15 text-brand shadow-[0_0_18px_rgba(45,212,191,0.15)]'
                : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white',
            )}
            aria-current={tab === id ? 'page' : undefined}
          >
            <Icon className="size-3.5" />
            {tabLabel(id)}
          </button>
        ))}
      </div>

      {tab === 'overview' && <ProjectOverview project={project} />}
      {tab === 'milestones' && <MilestonesPanel projectId={id} />}
      {tab === 'change-requests' && <ChangeRequestsPanel projectId={id} />}
      {tab === 'updates' && <UpdatesPanel projectId={id} />}
      {tab === 'current-work' && <CurrentWorkPanel projectId={id} />}
      {tab === 'client-access' && <ClientAccessPanel projectId={id} clientAccessEnabled={project.clientAccessEnabled} />}
      {tab === 'activity' && <ActivityFeed projectId={id} />}
    </div>
  );
}