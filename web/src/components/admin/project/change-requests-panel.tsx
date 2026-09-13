'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Plus, RefreshCw, XCircle } from 'lucide-react';
import { changeRequestSchema, type ChangeRequestValues } from '@/lib/validation';
import {
  useApproveChangeRequest,
  useCancelChangeRequest,
  useChangeRequests,
  useCreateChangeRequest,
  useRejectChangeRequest,
} from '@/lib/hooks/use-change-requests';
import { ChangeRequestStatusPill } from '@/components/shared/pills';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Dialog } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/skeleton';
import { formatLedgerDate } from '@/lib/utils';

export function ChangeRequestsPanel({ projectId }: { projectId: string }) {
  const { data: changeRequests, isLoading } = useChangeRequests(projectId);
  const create = useCreateChangeRequest(projectId);
  const approve = useApproveChangeRequest(projectId);
  const reject = useRejectChangeRequest(projectId);
  const cancel = useCancelChangeRequest(projectId);
  const [createOpen, setCreateOpen] = useState(false);

  const form = useForm<ChangeRequestValues>({
    resolver: zodResolver(changeRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      reason: '',
      estimatedAdditionalDays: 1,
      estimatedAdditionalHours: undefined,
      clientVisible: true,
    },
  });

  const pending = changeRequests?.filter((c) => c.status === 'PENDING') ?? [];
  const resolved = changeRequests?.filter((c) => c.status !== 'PENDING') ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Change Requests</h3>
        <Button onClick={() => setCreateOpen(true)}><Plus /> Raise CR</Button>
      </div>

      {isLoading && <Spinner className="mx-auto my-6" />}

      {!isLoading && pending.length === 0 && resolved.length === 0 && (
        <p className="rounded-md border border-dashed border-line px-6 py-10 text-center text-sm text-ink/50 dark:text-zinc-500">
          No change requests yet.
        </p>
      )}

      {pending.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-zinc-500">Pending</p>
          {pending.map((cr) => (
            <div key={cr.id} className="flex items-start gap-4 rounded-md border border-amber/30 bg-amber/5 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold">{cr.title}</p>
                {cr.description && <p className="mt-1 text-sm text-ink/60 dark:text-zinc-400">{cr.description}</p>}
                <p className="mt-1.5 text-xs text-ink/50 dark:text-zinc-500">
                  Est. delay: <span className="font-mono font-semibold text-amber">+{cr.estimatedAdditionalDays}d</span>
                  {cr.estimatedAdditionalHours != null && ` · ${cr.estimatedAdditionalHours}h`}
                </p>
                {cr.reason && <p className="mt-1 text-xs text-ink/45 dark:text-zinc-500">Reason: {cr.reason}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => approve.mutate(cr.id)}
                  disabled={approve.isPending}
                >
                  <CheckCircle2 className="size-3.5" /> Approve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => reject.mutate(cr.id)}
                  disabled={reject.isPending}
                >
                  <XCircle className="size-3.5" /> Reject
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancel.mutate(cr.id)}
                  disabled={cancel.isPending}
                >
                  <RefreshCw className="size-3.5" /> Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-zinc-500">Resolved</p>
          {resolved.map((cr) => (
            <div key={cr.id} className="flex items-center gap-3 rounded-md border border-line p-3 opacity-70">
              <ChangeRequestStatusPill status={cr.status} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{cr.title}</p>
                <p className="text-xs text-ink/45 dark:text-zinc-500">
                  +{cr.estimatedAdditionalDays}d · {cr.approvedAt ? `approved ${formatLedgerDate(cr.approvedAt)}` : cr.rejectedAt ? `rejected ${formatLedgerDate(cr.rejectedAt)}` : ''}
                </p>
              </div>
              {cr.previousCompletionDate && cr.newCompletionDate && (
                <p className="text-xs text-ink/50 dark:text-zinc-500">
                  ETA {formatLedgerDate(cr.previousCompletionDate)} → <span className="font-medium text-brand">{formatLedgerDate(cr.newCompletionDate)}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen} title="Raise a change request" description="Requests create estimatedAdditionalDays that move the current estimate.">
        <form
          onSubmit={form.handleSubmit((v) =>
            create.mutate(
              { ...v, estimatedAdditionalHours: v.estimatedAdditionalHours || undefined },
              { onSuccess: () => { setCreateOpen(false); form.reset(); } },
            ),
          )}
          className="flex flex-col gap-4"
        >
          <Field label="Title" required error={form.formState.errors.title}>
            <Input placeholder="New feature request from client" {...form.register('title')} />
          </Field>
          <Field label="Description" error={form.formState.errors.description}>
            <Textarea rows={3} {...form.register('description')} />
          </Field>
          <Field label="Reason / justification" error={form.formState.errors.reason}>
            <Textarea rows={2} {...form.register('reason')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Additional days (min 1)" required error={form.formState.errors.estimatedAdditionalDays}>
              <Input type="number" min={1} {...form.register('estimatedAdditionalDays')} />
            </Field>
            <Field label="Additional hours (optional)" error={form.formState.errors.estimatedAdditionalHours}>
              <Input type="number" min={0} step="0.5" {...form.register('estimatedAdditionalHours')} />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.watch('clientVisible')} onCheckedChange={(v) => form.setValue('clientVisible', v)} />
            <span className="text-sm text-ink/60 dark:text-zinc-400">Visible to client</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? <Spinner /> : 'Raise CR'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}