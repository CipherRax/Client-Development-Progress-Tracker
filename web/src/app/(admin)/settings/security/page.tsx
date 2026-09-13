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
import { usePathname } from 'next/navigation';

const SETTINGS_TABS = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/security', label: 'Security' },
];

export default function SettingsSecurityPage() {
  const pathname = usePathname();
  const change = useChangePassword();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

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