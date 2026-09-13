import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-4 animate-spin text-brand', className)}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-black/[0.06] dark:bg-white/[0.07]', className)} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
      <Spinner className="size-6" />
    </div>
  );
}