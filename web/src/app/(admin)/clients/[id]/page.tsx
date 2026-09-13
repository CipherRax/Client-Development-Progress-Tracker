'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Archive, ChevronLeft, Pencil, Plus } from 'lucide-react';
import { useClient } from '@/lib/hooks/use-clients';
import { useProjects } from '@/lib/hooks/use-projects';
import { useArchiveClient } from '@/lib/hooks/use-clients';
import { ClientStatusPill, StatusPill, HealthPill } from '@/components/shared/pills';
import { ProgressRing } from '@/components/shared/progress-ring';
import { formatLedgerDate, formatShortDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CenteredLoader, ErrorState, EmptyState } from '@/components/shared/states';
import { ClientForm } from '@/components/admin/client-form';
import { Dialog } from '@/components/ui/dialog';

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data: client, isLoading, isError, error, refetch } = useClient(id);
  const projects = useProjects({ clientId: id, limit: 100 });
  const archive = useArchiveClient();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (archive.isSuccess) setEditing(false);
  }, [archive.isSuccess]);

  if (isLoading) return <CenteredLoader label="Loading client" />;
  if (isError || !client) return <ErrorState description={error?.message} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/clients" className="inline-flex w-fit items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-brand">
        <ChevronLeft className="size-4" /> Back to clients
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-brand/70">client profile</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-glow font-display text-2xl font-bold tracking-tight">{client.name}</h1>
            <ClientStatusPill status={client.status} />
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {client.companyName || 'No company'} · added {formatLedgerDate(client.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil /> Edit
          </Button>
          {client.status !== 'ARCHIVED' && (
            <Button variant="outline" size="sm" onClick={() => archive.mutate(client.id)} disabled={archive.isPending}>
              <Archive /> Archive
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50 dark:text-zinc-500">Email</p>
              <p className="break-words">{client.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50 dark:text-zinc-500">Phone</p>
              <p>{client.phone || '—'}</p>
            </div>
            {client.notes && (
              <div>
                <p className="text-xs uppercase tracking-wide text-ink/50 dark:text-zinc-500">Notes</p>
                <p className="whitespace-pre-wrap text-ink/80 dark:text-zinc-300">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Projects</CardTitle>
            <Link href={`/projects/new?client=${client.id}`}>
              <Button variant="soft" size="sm"><Plus /> New project</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {projects.isLoading && <CenteredLoader label="Loading projects" />}
            {projects.isError && <ErrorState description={projects.error?.message} onRetry={() => projects.refetch()} />}
            {projects.data?.projects.length === 0 && (
              <EmptyState title="No projects for this client" description="Create a project to start tracking progress." />
            )}
            <div className="flex flex-col divide-y divide-line">
              {projects.data?.projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="group flex items-center gap-3 py-3">
                  <ProgressRing value={p.progressPercentage} size={38} stroke={4} showLabel={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold group-hover:text-brand">{p.name}</p>
                    <p className="text-xs text-ink/50 dark:text-zinc-500">ETA {formatShortDate(p.currentEstimatedCompletionDate)}</p>
                  </div>
                  <StatusPill status={p.status} />
                  <HealthPill health={p.health} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editing} onOpenChange={setEditing} title="Edit client" description={`Update details for ${client.name}`}>
        <ClientForm
          initial={{
            id: client.id,
            name: client.name,
            companyName: client.companyName ?? '',
            email: client.email,
            phone: client.phone ?? '',
            notes: client.notes ?? '',
          }}
          submitLabel="Save changes"
          onDone={() => setEditing(false)}
        />
      </Dialog>
    </div>
  );
}