'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterValues } from '@/lib/validation/auth';
import { useRegister } from '@/lib/hooks/use-auth';
import { AuthShell, AuthField, authInputClass } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/skeleton';

export default function RegisterPage() {
  const router = useRouter();
  const registerMut = useRegister();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterValues) => {
    const { confirmPassword: _, ...payload } = values;
    await registerMut.mutateAsync(payload);
    router.push('/login');
  };

  return (
    <AuthShell
      eyebrow="new operator"
      title="Create account"
      subtitle="Provision a new admin identity for the studio."
      footer={
        <p className="text-center text-sm text-white/45">
          Already registered?{' '}
          <Link href="/login" className="font-medium text-brand underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {registerMut.isError && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {(registerMut.error as Error)?.message ?? 'Registration failed'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <AuthField label="Name" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" placeholder="Jane Dev" className={authInputClass} {...register('name')} aria-invalid={!!errors.name} />
        </AuthField>

        <AuthField label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="jane@agency.dev"
            className={authInputClass}
            {...register('email')}
            aria-invalid={!!errors.email}
          />
        </AuthField>

        <AuthField label="Password" htmlFor="password" required error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="min 8 · upper · lower · digit · symbol"
            className={authInputClass}
            {...register('password')}
            aria-invalid={!!errors.password}
          />
        </AuthField>

        <AuthField label="Confirm password" htmlFor="confirmPassword" required error={errors.confirmPassword?.message}>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="repeat it"
            className={authInputClass}
            {...register('confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
          />
        </AuthField>

        <Button
          type="submit"
          disabled={registerMut.isPending}
          className="mt-1 w-full rounded-lg bg-gradient-to-r from-brand-strong via-brand to-brand-strong font-semibold shadow-[0_0_26px_rgba(45,212,191,0.35)] transition-shadow hover:shadow-[0_0_38px_rgba(45,212,191,0.5)]"
        >
          {registerMut.isPending ? <Spinner className="size-4 text-white" /> : (
            <span className="text-[13px] tracking-[0.14em] uppercase">Create account</span>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}