import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Link invalid or expired',
  robots: { index: false, follow: false },
};

export default function InvalidTokenPage() {
  return (
    <div className="scheme-dark dark relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#06080c] px-6 text-white">
      <div aria-hidden className="animate-pulse-glow pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-danger/15 blur-[130px]" />
      <div aria-hidden className="bg-grid-dark mask-fade pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danger/60 to-transparent" />

      <div className="relative animate-fade-up flex flex-col items-center text-center">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl border border-danger/25 bg-danger/10 shadow-[0_0_30px_rgba(248,113,113,0.15)]">
          <Lock className="size-6 text-red-400" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          This link is invalid or has been revoked
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/50">
          Secure progress links are single-use. If you believe this is a mistake,
          ask your developer to send a fresh link.
        </p>
        <Link
          href="/login"
          className="mt-8 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-brand/80 underline-offset-4 hover:text-brand hover:underline"
        >
          return to console
        </Link>
      </div>
    </div>
  );
}