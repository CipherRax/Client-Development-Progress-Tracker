'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, type ClientValues } from '@/lib/validation/client';
import { useCreateClient, useUpdateClient } from '@/lib/hooks/use-clients';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/form';
import { Spinner } from '@/components/ui/skeleton';

export function ClientForm({
  initial,
  onDone,
  submitLabel = 'Create client',
}: {
  initial?: Partial<ClientValues> & { id?: string };
  onDone?: () => void;
  submitLabel?: string;
}) {
  const create = useCreateClient();
  const update = useUpdateClient(initial?.id ?? '');
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initial?.name ?? '',
      companyName: initial?.companyName ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      notes: initial?.notes ?? '',
    },
  });

  const onSubmit = async (values: ClientValues) => {
    setServerError(null);
    try {
      if (initial?.id) await update.mutateAsync(values);
      else await create.mutateAsync(values);
      onDone?.();
    } catch (e) {
      setServerError((e as Error).message);
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {serverError && <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{serverError}</div>}

      <Field label="Client name" required error={errors.name}>
        <Input id="name" placeholder="Acme Ltd" {...register('name')} />
      </Field>

      <Field label="Company name" error={errors.companyName}>
        <Input id="companyName" placeholder="Acme Corporation" {...register('companyName')} />
      </Field>

      <Field label="Email" required error={errors.email}>
        <Input id="email" type="email" placeholder="owner@acme.example" {...register('email')} />
      </Field>

      <Field label="Phone" error={errors.phone}>
        <Input id="phone" type="tel" placeholder="+1 555 000 1234" {...register('phone')} />
      </Field>

      <Field label="Notes" error={errors.notes}>
        <Textarea id="notes" rows={3} placeholder="Preferences, contact info, context…" {...register('notes')} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Spinner className="size-4 text-white" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}