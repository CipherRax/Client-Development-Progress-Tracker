import { Inbox, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/skeleton';

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-14 text-center', className)}>
      <div className="flex size-11 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.05]">
        <Inbox className="size-5 text-ink/40 dark:text-zinc-500" />
      </div>
      <p className="font-display text-sm font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink/60 dark:text-zinc-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-14 text-center', className)}>
      <div className="flex size-11 items-center justify-center rounded-full bg-danger/10">
        <TriangleAlert className="size-5 text-danger" />
      </div>
      <p className="font-display text-sm font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink/60 dark:text-zinc-400">{description}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 p-5" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-black/[0.06] dark:bg-white/[0.07]" />
            <div className="h-3 w-24 animate-pulse rounded bg-black/[0.04] dark:bg-white/[0.05]" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded-full bg-black/[0.06] dark:bg-white/[0.07]" />
        </div>
      ))}
      <Spinner className="mx-auto mt-2" />
    </div>
  );
}

export function CenteredLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink/60 dark:text-zinc-400">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}