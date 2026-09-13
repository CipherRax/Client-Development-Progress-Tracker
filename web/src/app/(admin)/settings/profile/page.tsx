'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { z } from 'zod';
import { useProfile } from '@/lib/hooks/use-auth';
import { useUpdateProfile } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner, PageLoader } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
});

type ProfileValues = z.infer<typeof profileSchema>;

const SETTINGS_TABS = [
  { href: '/settings/profile', label: 'Profile', active: true },
  { href: '/settings/security', label: 'Security', active: false },
];

export default function SettingsProfilePage() {
  const { data: profile, isLoading, isError } = useProfile();
  const update = useUpdateProfile();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: profile ? { name: profile.name, email: profile.email } : undefined,
  });

  if (isLoading) return <PageLoader />;
  if (isError || !profile) return <p className="py-10 text-center text-sm text-danger">Failed to load profile.</p>;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
      </header>

      <div className="flex gap-1 border-b border-line pb-px">
        {SETTINGS_TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'rounded-t-[3px] border-b-2 px-3 py-2 text-sm font-medium',
              t.active
                ? 'border-brand text-brand-strong dark:text-brand'
                : 'border-transparent text-ink/60 dark:text-zinc-400 hover:text-ink',
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v) => update.mutate(v))}
            className="flex flex-col gap-4"
          >
            <Field label="Name" required error={errors.name}>
              <Input {...register('name')} />
            </Field>
            <Field label="Email" required error={errors.email}>
              <Input type="email" {...register('email')} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => reset()}>Reset</Button>
              <Button type="submit" disabled={!isDirty || update.isPending}>
                {update.isPending ? <Spinner /> : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}