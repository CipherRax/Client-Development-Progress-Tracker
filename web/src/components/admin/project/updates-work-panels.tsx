'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Send, Trash2 } from 'lucide-react';
import { updateSchema, type UpdateValues, currentWorkSchema, type CurrentWorkValues } from '@/lib/validation';
import { useCreateUpdate, useDeleteUpdate, useUpdates } from '@/lib/hooks/use-misc';
import { useCurrentWork, useSetCurrentWork, useClearCurrentWork } from '@/lib/hooks/use-misc';
import { UpdateVisibilityPill } from '@/components/shared/pills';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/form';
import { Dialog } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/skeleton';
import { formatLedgerDate } from '@/lib/utils';

// ─── Updates Panel ────────────────────────────────────────────────
export function UpdatesPanel({ projectId }: { projectId: string }) {
  const { data: updates, isLoading } = useUpdates(projectId);
  const create = useCreateUpdate(projectId);
  const del = useDeleteUpdate(projectId);
  const [createOpen, setCreateOpen] = useState(false);

  const form = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { title: '', content: '', visibility: 'PUBLIC' },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Project Updates</h3>
        <Button onClick={() => setCreateOpen(true)}><Plus /> New update</Button>
      </div>

      {isLoading && <Spinner className="mx-auto my-6" />}
      {!isLoading && updates?.length === 0 && (
        <p className="rounded-md border border-dashed border-line px-6 py-10 text-center text-sm text-ink/50 dark:text-zinc-500">
          Publish updates to create a searchable activity log for this project.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {updates?.map((u) => (
          <div key={u.id} className="rounded-md border border-line p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold">{u.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink/70 dark:text-zinc-300">{u.content}</p>
                <p className="mt-1.5 text-xs text-ink/45 dark:text-zinc-500">{formatLedgerDate(u.publishedAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <UpdateVisibilityPill visibility={u.visibility} />
                <Button variant="ghost" size="icon-sm" onClick={() => del.mutate(u.id)} disabled={del.isPending} aria-label="Delete update">
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen} title="Publish an update" description="CLIENT_REVIEW status updates go live to the client dashboard immediately.">
        <form
          onSubmit={form.handleSubmit((v) =>
            create.mutate(v, { onSuccess: () => { setCreateOpen(false); form.reset(); } }),
          )}
          className="flex flex-col gap-4"
        >
          <Field label="Title" required error={form.formState.errors.title}>
            <Input {...form.register('title')} />
          </Field>
          <Field label="Content" required error={form.formState.errors.content}>
            <Textarea rows={4} {...form.register('content')} />
          </Field>
          <Field label="Visibility" error={form.formState.errors.visibility}>
            <select className="flex h-9 w-full appearance-none rounded-md border border-line bg-transparent px-3 py-1 text-sm" {...form.register('visibility')}>
              <option value="PUBLIC">Public (visible to client)</option>
              <option value="INTERNAL">Internal only</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Spinner /> : <><Send /> Publish</>}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

// ─── Current Work Panel ───────────────────────────────────────────
export function CurrentWorkPanel({ projectId }: { projectId: string }) {
  const { data: work } = useCurrentWork(projectId);
  const setWork = useSetCurrentWork(projectId);
  const clear = useClearCurrentWork(projectId);
  const [editOpen, setEditOpen] = useState(false);

  const form = useForm<CurrentWorkValues>({
    resolver: zodResolver(currentWorkSchema),
    defaultValues: {
      title: work?.[0]?.title ?? '',
      description: work?.[0]?.description ?? '',
      expectedCompletionDate: work?.[0]?.expectedCompletionDate?.slice(0, 10) ?? '',
    },
  });

  const activeWork = work?.[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-display text-base font-semibold">Current Work</h3>

      {!activeWork && (
        <p className="rounded-md border border-dashed border-line px-6 py-6 text-center text-sm text-ink/50 dark:text-zinc-500">
          No current work is being displayed to clients.
        </p>
      )}

      {activeWork && (
        <div className="rounded-md border border-brand/20 bg-brand/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-sm font-semibold">{activeWork.title}</p>
              {activeWork.description && <p className="mt-1 text-sm text-ink/60 dark:text-zinc-400">{activeWork.description}</p>}
              {activeWork.expectedCompletionDate && (
                <p className="mt-1 text-xs text-ink/50 dark:text-zinc-500">
                  Expected: {formatLedgerDate(activeWork.expectedCompletionDate)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => clear.mutate()} disabled={clear.isPending}>Clear</Button>
            </div>
          </div>
        </div>
      )}

      {!activeWork && (
        <Button variant="soft" onClick={() => setEditOpen(true)}>Set current work</Button>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen} title="Current work" description="Shown to clients as the 'focus right now' row.">
        <form
          onSubmit={form.handleSubmit((v) =>
            setWork.mutate(v, { onSuccess: () => setEditOpen(false) }),
          )}
          className="flex flex-col gap-4"
        >
          <Field label="What are we focusing on?" required error={form.formState.errors.title}>
            <Input placeholder="Backend API integration" {...form.register('title')} />
          </Field>
          <Field label="Description (optional)" error={form.formState.errors.description}>
            <Textarea rows={2} {...form.register('description')} />
          </Field>
          <Field label="Expected completion" error={form.formState.errors.expectedCompletionDate}>
            <Input type="date" {...form.register('expectedCompletionDate')} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={setWork.isPending}>{setWork.isPending ? <Spinner /> : 'Save'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}