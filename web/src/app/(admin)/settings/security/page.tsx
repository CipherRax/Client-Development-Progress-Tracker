'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useChangePassword } from '@/lib/hooks/use-auth';
import { changePasswordSchema, type ChangePasswordValues } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Spinner } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SETTINGS_TABS = [
  { href: '/settings/profile', label: 'Profile', active: false },
  { href: '/settings/security', label: 'Security', active: true },
];

export default function SettingsSecurityPage() {
  const change = useChangePassword();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

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
          <CardTitle>Change password</CardTitle>
          <CardDescription>At least 8 characters, with upper, lower, number and a special character.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v) =>
              change.mutate(
                { currentPassword: v.currentPassword, newPassword: v.newPassword },
                { onSuccess: () => reset() },
              ),
            )}
            className="flex flex-col gap-4"
          >
            <Field label="Current password" required error={errors.currentPassword}>
              <Input type="password" autoComplete="current-password" {...register('currentPassword')} />
            </Field>
            <Field label="New password" required error={errors.newPassword}>
              <Input type="password" autoComplete="new-password" {...register('newPassword')} />
            </Field>
            <Field label="Confirm new password" required error={errors.confirmPassword}>
              <Input type="password" autoComplete="new-password" {...register('confirmPassword')} />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" disabled={change.isPending}>
                {change.isPending ? <Spinner /> : 'Update password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>Access tokens are stored securely. Silent refresh keeps you signed in.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}