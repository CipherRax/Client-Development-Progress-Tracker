import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'brand' | 'amber' | 'danger' | 'success';
  className?: string;
}) {
  const accentClass =
    accent === 'brand'
      ? 'text-brand'
      : accent === 'amber'
        ? 'text-amber'
        : accent === 'danger'
          ? 'text-danger'
          : accent === 'success'
            ? 'text-success'
            : 'text-white';
  const barClass =
    accent === 'brand'
      ? 'from-brand to-brand-strong'
      : accent === 'amber'
        ? 'from-amber/80 to-amber/20'
        : accent === 'danger'
          ? 'from-danger/80 to-danger/20'
          : accent === 'success'
            ? 'from-success/80 to-success/20'
            : 'from-line to-transparent';
  return (
    <div className={cn(
      'relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.04] p-5 shadow-[0_2px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:border-brand/40 hover:shadow-[0_0_28px_rgba(45,212,191,0.12)]',
      className,
    )}>
      <div aria-hidden className={cn('absolute inset-x-0 top-0 h-px bg-gradient-to-r', barClass)} />
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500">{label}</p>
      <p className={cn('mt-2 font-mono text-3xl font-semibold font-mono-num text-glow', accentClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}