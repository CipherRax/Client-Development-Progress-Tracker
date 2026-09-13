import * as React from 'react';
import { cn } from '@/lib/utils';

export const Switch = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { checked: boolean; onCheckedChange?: (v: boolean) => void }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange?.(!checked)}
    className={cn(
      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-line transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50',
      checked ? 'bg-brand border-brand' : 'bg-black/10 dark:bg-white/10',
      className,
    )}
    {...props}
  >
    <span
      className={cn(
        'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
        checked ? 'translate-x-[18px]' : 'translate-x-0.5',
      )}
    />
  </button>
));
Switch.displayName = 'Switch';