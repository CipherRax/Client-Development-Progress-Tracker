import * as React from 'react';
import type { FieldError } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from './label';

export function FieldError({ error }: { error?: FieldError | string }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-danger">
      {message}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  required,
  children,
  hint,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: FieldError | string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-ink/50 dark:text-zinc-500">{hint}</p>}
      <FieldError error={error} />
    </div>
  );
}