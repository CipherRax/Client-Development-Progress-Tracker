'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Forced-dark, glassmorphic auth canvas: aurora orbs, a fine technical grid,
 * a drifting scan line and a frosted glass card. Never follows the admin theme
 * — this is the "developer console" aesthetic that frames sign in / sign up.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="dark scheme-dark relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#06080c] px-4 py-12 text-white">
      {/* Aurora orbs */}
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute -top-44 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[130px]"
      />
      <div
        aria-hidden
        className="animate-drift-slow pointer-events-none absolute -bottom-48 -right-24 h-[28rem] w-[28rem] rounded-full bg-plum/20 blur-[130px]"
      />
      <div
        aria-hidden
        className="animate-pulse-glow pointer-events-none absolute -left-32 top-1/3 h-72 w-72 rounded-full bg-info/15 blur-[110px]"
      />

      {/* Technical grid + edge fade */}
      <div aria-hidden className="bg-grid-dark mask-fade pointer-events-none absolute inset-0 opacity-70" />

      {/* Drifting scan line */}
      <div
        aria-hidden
        className="animate-scan pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/70 to-transparent"
      />

      {/* Hairline top accent */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent"
      />

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Brand mark */}
        <div className="mb-7 flex flex-col items-center gap-2.5">
          <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] font-display text-lg font-bold text-brand shadow-[0_0_30px_rgba(45,212,191,0.25)] backdrop-blur">
            C
          </div>
          <p className="font-display text-xs font-semibold tracking-[0.3em] text-white/70 uppercase">
            CDPT Console
          </p>
        </div>

        {/* Glass card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-7 shadow-[0_8px_50px_rgba(0,0,0,0.55),0_0_60px_rgba(45,212,191,0.08)] backdrop-blur-xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-brand/15 blur-2xl"
          />

          <div className="relative">
            <p className="font-mono text-[11px] font-medium tracking-[0.25em] text-brand uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-white/55">{subtitle}</p>

            <div className="mt-6 flex flex-col gap-4">{children}</div>

            {footer && <div className="relative mt-7">{footer}</div>}
          </div>
        </div>

        <p className="mt-6 animate-fade-in text-center font-mono text-[11px] text-white/25">
          authenticated workspace · studio ledger · est. 2026
        </p>
      </div>
    </div>
  );
}

/** Labelled, glassy field for the auth cards. */
export function AuthField({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-mono text-[11px] font-medium tracking-[0.14em] text-white/55 uppercase"
      >
        {label}
        {required && <span className="text-brand"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

/** Glass field surface shared by the auth inputs. */
export const authInputClass = cn(
  'border-white/10 bg-white/[0.04] text-white placeholder:text-white/30',
  'focus-visible:border-brand focus-visible:ring-brand/40',
  'dark:bg-white/[0.04] dark:text-white',
);