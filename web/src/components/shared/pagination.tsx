import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  className?: string;
}) {
  if (totalPages <= 1 && !total) return null;
  return (
    <div className={cn('flex items-center justify-between gap-4 px-5 py-3', className)}>
      <p className="text-xs text-ink/50 dark:text-zinc-500">
        {total !== undefined ? `${total} total · ` : ''}
        Page {page} of {Math.max(1, totalPages)}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-line p-1.5 disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-line p-1.5 disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}