'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, CircleDot, GripVertical, ListChecks, Plus, Trash2 } from 'lucide-react';
import type { Milestone, Task } from '@/lib/api/types';
import { MILESTONE_STATUSES } from '@/lib/validation/enums';
import { milestoneSchema, type MilestoneValues, taskSchema, type TaskValues } from '@/lib/validation';
import { useMilestones, useCreateMilestone, useChangeMilestoneStatus, useDeleteMilestone } from '@/lib/hooks/use-projects';
import { useCreateTask, useChangeTaskStatus, useDeleteTask } from '@/lib/hooks/use-projects';
import { MilestoneStatusPill, TaskStatusPill, PriorityPill } from '@/components/shared/pills';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Dialog } from '@/components/ui/dialog';
import { Spinner, Skeleton } from '@/components/ui/skeleton';
import { formatShortDate } from '@/lib/utils';

export function MilestonesPanel({ projectId }: { projectId: string }) {
  const { data: milestones, isLoading } = useMilestones(projectId);
  const create = useCreateMilestone(projectId);
  const [createOpen, setCreateOpen] = useState(false);

  const mForm = useForm<MilestoneValues>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      title: '',
      description: '',
      weight: 1,
      startDate: '',
      estimatedCompletionDate: '',
      clientVisible: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold">Milestones</h3>
          <p className="text-sm text-ink/60 dark:text-zinc-400">
            Ordered, weighted checkpoints that drive the progress percentage.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={create.isPending}><Plus /> Add milestone</Button>
      </div>

      {isLoading && (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      )}

      <div className="flex flex-col gap-4">
        {milestones?.map((m) => <MilestoneRow key={m.id} projectId={projectId} milestone={m} />)}
        {milestones?.length === 0 && (
          <p className="rounded-md border border-dashed border-line px-6 py-10 text-center text-sm text-ink/50 dark:text-zinc-500">
            No milestones yet — break the project into checkpoints.
          </p>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen} title="Add milestone">
        <form
          onSubmit={mForm.handleSubmit((v) =>
            create.mutate(
              {
                ...v,
                weight: v.weight || 1,
                startDate: v.startDate || undefined,
                estimatedCompletionDate: v.estimatedCompletionDate || undefined,
              },
              { onSuccess: () => { setCreateOpen(false); mForm.reset(); } },
            ),
          )}
          className="flex flex-col gap-4"
        >
          <Field label="Title" required error={mForm.formState.errors.title}>
            <Input placeholder="Design review" {...mForm.register('title')} />
          </Field>
          <Field label="Description" error={mForm.formState.errors.description}>
            <Textarea rows={2} {...mForm.register('description')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Weight (0–100)" error={mForm.formState.errors.weight}>
              <Input type="number" min={0} max={100} {...mForm.register('weight')} />
            </Field>
            <Field label="Client visible" error={undefined}>
              <div className="flex h-9 items-center">
                <Switch checked={mForm.watch('clientVisible')} onCheckedChange={(v) => mForm.setValue('clientVisible', v)} />
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date" error={mForm.formState.errors.startDate}>
              <Input type="date" {...mForm.register('startDate')} />
            </Field>
            <Field label="Est. completion" error={mForm.formState.errors.estimatedCompletionDate}>
              <Input type="date" {...mForm.register('estimatedCompletionDate')} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? <Spinner /> : 'Add milestone'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function MilestoneRow({ projectId, milestone }: { projectId: string; milestone: Milestone }) {
  const [tasksOpen, setTasksOpen] = useState(false);
  const changeStatus = useChangeMilestoneStatus(projectId);
  const deleteM = useDeleteMilestone(projectId);

  return (
    <div className="rounded-md border border-line bg-white dark:bg-panel">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <span className="text-ink/25 dark:text-zinc-600"><GripVertical className="size-4" /></span>
        <CircleDot className={`size-4 ${milestone.status === 'IN_PROGRESS' ? 'text-sky-500' : milestone.status === 'COMPLETED' ? 'text-success' : 'text-ink/30 dark:text-zinc-500'}`} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold">{milestone.title}</p>
          <p className="text-xs text-ink/50 dark:text-zinc-500">
            #{milestone.order + 1} · weight {milestone.weight} · {milestone.progressPercentage}% ·{' '}
            {milestone.estimatedCompletionDate ? `due ${formatShortDate(milestone.estimatedCompletionDate)}` : 'no due date'}
            {milestone.clientVisible ? '' : ' · hidden from client'}
          </p>
        </div>
        <MilestoneStatusPill status={milestone.status} />
        <div className="flex items-center gap-1">
          <Select
            value={milestone.status}
            className="h-8 w-36 text-xs"
            onChange={(e) => changeStatus.mutate({ id: milestone.id, status: e.target.value })}
            aria-label="Milestone status"
          >
            {MILESTONE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </Select>
          <Button variant="ghost" size="icon-sm" onClick={() => deleteM.mutate(milestone.id)} disabled={deleteM.isPending} aria-label="Delete milestone">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setTasksOpen((v) => !v)}
        className="flex w-full items-center gap-2 border-t border-line px-4 py-2 text-xs font-medium text-ink/55 dark:text-zinc-400 hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
      >
        <ListChecks className="size-3.5" />
        {tasksOpen ? 'Hide' : 'Show'} tasks ({milestone.tasks?.length ?? 0})
        <span className="ml-auto font-mono text-ink/40 dark:text-zinc-500">
          {milestone.tasks?.filter((t) => t.status === 'COMPLETED').length ?? 0}/{milestone.tasks?.length ?? 0} done
        </span>
      </button>

      {tasksOpen && <TasksList projectId={projectId} milestoneId={milestone.id} tasks={milestone.tasks ?? []} />}
    </div>
  );
}

function TasksList({
  projectId,
  milestoneId,
  tasks,
}: {
  projectId: string;
  milestoneId: string;
  tasks: Task[];
}) {
  const createTask = useCreateTask(projectId);
  const changeTaskStatus = useChangeTaskStatus(projectId);
  const deleteTask = useDeleteTask(projectId);
  const [addOpen, setAddOpen] = useState(false);
  const tForm = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '', priority: 'MEDIUM', estimatedHours: undefined, clientVisible: true },
  });

  return (
    <div className="space-y-1 border-t border-line bg-black/[0.015] p-3 dark:bg-white/[0.02]">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-3 rounded border border-transparent px-3 py-2 hover:border-line">
          <button
            type="button"
            onClick={() =>
              changeTaskStatus.mutate({ id: t.id, status: t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED' })
            }
            aria-label={t.status === 'COMPLETED' ? 'Mark task incomplete' : 'Mark task complete'}
          >
            {t.status === 'COMPLETED' ? (
              <CheckCircle2 className="size-4 text-success" />
            ) : (
              <CircleDot className="size-4 text-ink/30 dark:text-zinc-500" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm ${t.status === 'COMPLETED' ? 'line-through text-ink/40 dark:text-zinc-500' : 'font-medium'}`}>
              {t.title}
            </p>
            {t.estimatedHours != null && (
              <p className="text-xs text-ink/45 dark:text-zinc-500">{t.estimatedHours}h est</p>
            )}
          </div>
          <PriorityPill priority={t.priority} />
          <TaskStatusPill status={t.status} />
          <Select
            value={t.status}
            className="h-7 w-32 text-xs"
            onChange={(e) => changeTaskStatus.mutate({ id: t.id, status: e.target.value })}
            aria-label="Task status"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
          <Button variant="ghost" size="icon-sm" onClick={() => deleteTask.mutate(t.id)} aria-label="Delete task">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="mt-1 flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/10"
      >
        <Plus className="size-3.5" /> Add task
      </button>

      <Dialog open={addOpen} onOpenChange={setAddOpen} title="Add task">
        <form
          onSubmit={tForm.handleSubmit((v) =>
            createTask.mutate(
              { milestoneId, ...v, estimatedHours: v.estimatedHours || undefined },
              { onSuccess: () => { setAddOpen(false); tForm.reset(); } },
            ),
          )}
          className="flex flex-col gap-4"
        >
          <Field label="Title" required error={tForm.formState.errors.title}>
            <Input {...tForm.register('title')} />
          </Field>
          <Field label="Description" error={tForm.formState.errors.description}>
            <Textarea rows={2} {...tForm.register('description')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority" error={tForm.formState.errors.priority}>
              <Select {...tForm.register('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </Select>
            </Field>
            <Field label="Estimated hours" error={tForm.formState.errors.estimatedHours}>
              <Input type="number" step="0.5" min={0} {...tForm.register('estimatedHours')} />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={tForm.watch('clientVisible')} onCheckedChange={(v) => tForm.setValue('clientVisible', v)} />
            <span className="text-sm text-ink/60 dark:text-zinc-400">Visible to client</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createTask.isPending}>{createTask.isPending ? <Spinner /> : 'Add task'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}