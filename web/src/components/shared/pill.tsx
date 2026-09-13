import { cn } from '@/lib/utils';
import type { PillStyle } from '@/lib/presentation';

export function Pill({
  meta,
  className,
}: {
  meta: PillStyle;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.className,
        className,
      )}
    >
      <span className="[&>svg]:size-3">{meta.Icon}</span>
      {meta.label}
    </span>
  );
}