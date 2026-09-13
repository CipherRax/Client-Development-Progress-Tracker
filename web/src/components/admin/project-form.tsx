'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { projectSchema, type ProjectValues } from '@/lib/validation/project';
import { useClients } from '@/lib/hooks/use-clients';
import { useCreateProject } from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/form';
import { Spinner } from '@/components/ui/skeleton';

export function ProjectForm({ clientId }: { clientId?: string }) {
  const router = useRouter();
  const clients = useClients({ status: 'ACTIVE', limit: 100 });
  const create = useCreateProject();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: clientId ?? '',
      name: '',
      description: '',
      startDate: '',
      estimateMode: 'duration',
      estimatedDurationDays: undefined,
      estimatedCompletionDate: '',
      status: 'PLANNING',
      health: 'ON_TRACK',
    },
  });

  const mode = watch('estimateMode');
  useEffect(() => {
    if (mode === 'duration') setValue('estimatedCompletionDate', '');
    else setValue('estimatedDurationDays', undefined);
  }, [mode, setValue]);

  const onSubmit = async (values: ProjectValues) => {
    const { estimateMode, estimatedDurationDays, estimatedCompletionDate, ...rest } = values;
    const project = await create.mutateAsync({
      ...rest,
      estimatedDurationDays: estimateMode === 'duration' ? estimatedDurationDays : undefined,
      estimatedCompletionDate:
        estimateMode === 'date' && estimatedCompletionDate ? estimatedCompletionDate : undefined,
    });
    router.push(`/projects/${project.id}`);
  };

  if (clients.isLoading) return <Spinner />;
  if (!clients.data || clients.data.clients.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-ink/60 dark:text-zinc-400">You need at least one active client before creating a project.</p>
        <Link href="/clients/new"><Button variant="soft" size="sm">Create a client</Button></Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field label="Client" required error={errors.clientId}>
        <Select {...register('clientId')} id="clientId">
          <option value="" disabled>Select a client…</option>
          {clients.data.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.companyName ? ` (${c.companyName})` : ''}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Project name" required error={errors.name}>
        <Input id="name" placeholder="E-commerce rebuild" {...register('name')} />
      </Field>

      <Field label="Description" error={errors.description}>
        <Textarea id="description" rows={3} placeholder="What are we building?" {...register('description')} />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Start date" required error={errors.startDate}>
          <Input id="startDate" type="date" {...register('startDate')} />
        </Field>

        <Field label="Estimate mode" hint="Duration auto-derives the ETA from today.">
          <Select {...register('estimateMode')} aria-label="Estimate mode">
            <option value="duration">Estimated duration (days)</option>
            <option value="date">Estimated completion date</option>
          </Select>
        </Field>

        {mode === 'duration' ? (
          <Field label="Estimated duration (days)" required error={errors.estimatedDurationDays}>
            <Input id="estimatedDurationDays" type="number" min={1} placeholder="30" {...register('estimatedDurationDays')} />
          </Field>
        ) : (
          <Field label="Estimated completion date" required error={errors.estimatedCompletionDate}>
            <Input id="estimatedCompletionDate" type="date" {...register('estimatedCompletionDate')} />
          </Field>
        )}

        <Field label="Initial status" error={errors.status}>
          <Select {...register('status')} aria-label="Initial status">
            <option value="PLANNING">Planning</option>
            <option value="REQUIREMENTS">Requirements</option>
            <option value="IN_PROGRESS">In Progress</option>
          </Select>
        </Field>

        <Field label="Initial health" error={errors.health}>
          <Select {...register('health')} aria-label="Initial health">
            <option value="ON_TRACK">On Track</option>
            <option value="AT_RISK">At Risk</option>
            <option value="DELAYED">Delayed</option>
          </Select>
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? <Spinner className="size-4 text-white" /> : 'Create project'}
        </Button>
      </div>
    </form>
  );
}