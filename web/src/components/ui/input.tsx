import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-line bg-transparent px-3 py-1 text-sm text-ink dark:bg-white/[0.05] dark:text-white shadow-none transition-colors placeholder:text-ink/40 dark:placeholder:text-zinc-500 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[80px] w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink dark:bg-white/[0.05] dark:text-white shadow-none transition-colors placeholder:text-ink/40 dark:placeholder:text-zinc-500 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

/**
 * Native <select> wrapped with a chevron. The closed control always gets a
 * visible surface (white / dark panel) — never a transparent ghost — and the
 * `color-scheme` rules in globals.css keep the native options popup legible.
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className={cn('relative w-full', className)}>
    <select
      ref={ref}
      className="flex h-9 w-full cursor-pointer appearance-none rounded-md border border-line bg-white px-3 pr-9 py-1 text-sm text-ink shadow-none transition-colors focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 dark:bg-panel dark:text-white dark:focus-visible:border-brand"
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden
      className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-ink/45 dark:text-zinc-500"
    />
  </div>
));
Select.displayName = 'Select';