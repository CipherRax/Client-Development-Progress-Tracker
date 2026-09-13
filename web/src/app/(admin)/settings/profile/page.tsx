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
import { usePathname } from 'next/navigation';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
});

type ProfileValues = z.infer<typeof profileSchema>;

const SETTINGS_TABS = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/security', label: 'Security' },
];

export default function SettingsProfilePage() {
  const pathname = usePathname();
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
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-brand/70">account settings</p>
        <h1 className="text-glow mt-1 font-display text-2xl font-bold tracking-tight">Settings</h1>
      </header>

      <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-xl">
        {SETTINGS_TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand/15 text-brand shadow-[0_0_18px_rgba(45,212,191,0.15)]'
                  : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white',
              )}
            >
              {t.label}
            </Link>
          );
        })}
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