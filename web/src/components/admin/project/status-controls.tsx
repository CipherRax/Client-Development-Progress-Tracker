'use client';

import { useState } from 'react';
import { Archive, CheckCircle2, Play, Pause, SlidersHorizontal, Undo2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Project, ProjectHealth } from '@/lib/api/types';
import { PROJECT_STATUSES } from '@/lib/validation/enums';
import { pauseProjectSchema, type PauseProjectValues, progressOverrideSchema, type ProgressOverrideValues, completeProjectSchema, type CompleteProjectValues } from '@/lib/validation/project';
import { isTerminal } from '@/lib/presentation';
import {
  useArchiveProject,
  useChangeProjectHealth,
  useChangeProjectStatus,
  useClearProgressOverride,
  useCompleteProject,
  usePauseProject,
  useResumeProject,
  useSetProgressOverride,
} from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/form';
import { Dialog } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function StatusControls({ project }: { project: Project }) {
  const terminal = isTerminal(project.status);
  const changeStatus = useChangeProjectStatus(project.id);
  const changeHealth = useChangeProjectHealth(project.id);
  const pause = usePauseProject(project.id);
  const resume = useResumeProject(project.id);
  const complete = useCompleteProject(project.id);
  const archive = useArchiveProject(project.id);

  const [pauseOpen, setPauseOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);

  const pauseForm = useForm<PauseProjectValues>({
    resolver: zodResolver(pauseProjectSchema),
    defaultValues: { reason: '' },
  });
  const completeForm = useForm<CompleteProjectValues>({
    resolver: zodResolver(completeProjectSchema),
    defaultValues: { notes: '' },
  });
  const overrideForm = useForm<ProgressOverrideValues>({
    resolver: zodResolver(progressOverrideSchema),
    defaultValues: { progressPercentage: project.progressPercentage, reason: '' },
  });

  const setOverride = useSetProgressOverride(project.id);
  const clearOverride = useClearProgressOverride(project.id);

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Status selector */}
      <div className="min-w-44">
        <label htmlFor="status" className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60 dark:text-zinc-400">
          Status
        </label>
        <Select
          id="status"
          value={project.status}
          disabled={terminal || project.status === 'PAUSED' || changeStatus.isPending}
          onChange={(e) => changeStatus.mutate(e.target.value)}
          className={cn('font-medium', terminal && 'opacity-60')}
          aria-label="Project status"
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </Select>
      </div>

      {/* Health selector */}
      <div className="min-w-40">
        <label htmlFor="health" className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60 dark:text-zinc-400">
          Health
        </label>
        <Select
          id="health"
          value={project.health}
          disabled={terminal || changeHealth.isPending}
          onChange={(e) => changeHealth.mutate(e.target.value as ProjectHealth)}
          aria-label="Project health"
        >
          <option value="ON_TRACK">On Track</option>
          <option value="AT_RISK">At Risk</option>
          <option value="DELAYED">Delayed</option>
        </Select>
      </div>

      {/* Lifecycle buttons */}
      {!terminal && (
        <div className="flex flex-wrap items-center gap-2">
          {project.status === 'PAUSED' ? (
            <Button variant="outline" size="sm" onClick={() => resume.mutate()} disabled={resume.isPending}>
              <Play /> Resume
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setPauseOpen(true)}>
              <Pause /> Pause
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setCompleteOpen(true)}>
            <CheckCircle2 /> Complete
          </Button>
          <Button variant="outline" size="sm" onClick={() => archive.mutate()} disabled={archive.isPending} className="text-ink/60 dark:text-zinc-400">
            <Archive /> Archive
          </Button>
        </div>
      )}

      {/* Progress override */}
      <div className="ml-auto flex items-center gap-2">
        <Button variant="soft" size="sm" onClick={() => setOverrideOpen(true)} disabled={terminal}>
          <SlidersHorizontal /> Override progress
        </Button>
        {project.progressManualOverride && (
          <Button variant="ghost" size="sm" onClick={() => clearOverride.mutate()} disabled={clearOverride.isPending}>
            <Undo2 /> Clear
          </Button>
        )}
        {project.progressManualOverride && (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber">
            <SlidersHorizontal className="size-3" /> Manual override active
          </span>
        )}
      </div>

      {/* Pause dialog */}
      <Dialog open={pauseOpen} onOpenChange={setPauseOpen} title="Pause project" description="Pausing freezes progress and defers the ETA by the paused time.">
        <form
          onSubmit={pauseForm.handleSubmit((v) =>
            pause.mutate(v.reason ?? undefined, { onSuccess: () => setPauseOpen(false) }),
          )}
          className="flex flex-col gap-4"
        >
          <Field label="Reason (optional)" error={pauseForm.formState.errors.reason}>
            <Textarea placeholder="Awaiting logo assets from client…" {...pauseForm.register('reason')} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPauseOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pause.isPending}>{pause.isPending ? <Spinner /> : <><Pause /> Pause project</>}</Button>
          </div>
        </form>
      </Dialog>

      {/* Complete dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen} title="Complete project" description="Progress is locked at 100% and no status changes are allowed afterwards.">
        <form
          onSubmit={completeForm.handleSubmit((v) =>
            complete.mutate(v.notes ?? undefined, { onSuccess: () => setCompleteOpen(false) }),
          )}
          className="flex flex-col gap-4"
        >
          <Field label="Completion notes (optional)" error={completeForm.formState.errors.notes}>
            <Textarea placeholder="Handover complete, docs delivered…" {...completeForm.register('notes')} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={complete.isPending}>{complete.isPending ? <Spinner /> : <><CheckCircle2 /> Mark complete</>}</Button>
          </div>
        </form>
      </Dialog>

      {/* Progress override dialog */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen} title="Override progress" description="Manually set the displayed progress. Cleared automatically when incompatible.">
        <form
          onSubmit={overrideForm.handleSubmit((v) =>
            setOverride.mutate(v, { onSuccess: () => setOverrideOpen(false) }),
          )}
          className="flex flex-col gap-4"
        >
          <Field label="Progress (%)" required error={overrideForm.formState.errors.progressPercentage}>
            <Input type="number" min={0} max={100} {...overrideForm.register('progressPercentage')} />
          </Field>
          <Field label="Reason (optional)" error={overrideForm.formState.errors.reason}>
            <Input placeholder="Client sign-off on phase 1…" {...overrideForm.register('reason')} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={setOverride.isPending}>{setOverride.isPending ? <Spinner /> : 'Apply override'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}