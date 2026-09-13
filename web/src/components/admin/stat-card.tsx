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
      ? 'text-brand-strong dark:text-brand'
      : accent === 'amber'
        ? 'text-amber'
        : accent === 'danger'
          ? 'text-danger'
          : accent === 'success'
            ? 'text-success'
            : 'text-ink dark:text-white';
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
      'relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-panel dark:hover:shadow-black/30',
      className,
    )}>
      <div aria-hidden className={cn('absolute inset-x-0 top-0 h-px bg-gradient-to-r', barClass)} />
      <p className="text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-zinc-500">{label}</p>
      <p className={cn('mt-2 font-mono text-3xl font-semibold font-mono-num', accentClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/50 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}