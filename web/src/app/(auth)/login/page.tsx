'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginValues } from '@/lib/validation/auth';
import { useLogin } from '@/lib/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { AuthShell, AuthField, authInputClass } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/skeleton';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const login = useLogin();

  useEffect(() => {
    if (token) router.replace('/dashboard');
  }, [token, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    await login.mutateAsync(values);
    router.push('/dashboard');
  };

  return (
    <AuthShell
      eyebrow="secure access"
      title="Welcome back"
      subtitle="Authenticate to enter the studio console."
      footer={
        <p className="text-center text-sm text-white/45">
          No account?{' '}
          <Link href="/register" className="font-medium text-brand underline-offset-2 hover:underline">
            Create one
          </Link>
        </p>
      }
    >
      {login.isError && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {(login.error as Error)?.message ?? 'Invalid credentials'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <AuthField label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@trackly.dev"
            className={authInputClass}
            {...register('email')}
            aria-invalid={!!errors.email}
          />
        </AuthField>

        <AuthField label="Password" htmlFor="password" required error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className={authInputClass}
            {...register('password')}
            aria-invalid={!!errors.password}
          />
        </AuthField>

        <Button
          type="submit"
          disabled={login.isPending}
          className="mt-1 w-full rounded-lg bg-gradient-to-r from-brand-strong via-brand to-brand-strong font-semibold shadow-[0_0_26px_rgba(45,212,191,0.35)] transition-shadow hover:shadow-[0_0_38px_rgba(45,212,191,0.5)]"
        >
          {login.isPending ? <Spinner className="size-4 text-white" /> : (
            <span className="text-[13px] tracking-[0.14em] uppercase">Sign in</span>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}