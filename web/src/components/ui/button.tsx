import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-display text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-brand text-white hover:bg-brand-strong rounded-[3px] border border-transparent',
        outline:
          'border border-line bg-transparent text-ink dark:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] rounded-[3px]',
        ghost:
          'text-ink dark:text-zinc-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] rounded-[3px]',
        destructive:
          'bg-danger/90 text-white hover:bg-danger rounded-[3px]',
        soft: 'bg-brand-soft text-brand-strong hover:bg-brand/15 rounded-[3px] border border-transparent',
        'public-paper':
          'bg-ink text-paper hover:bg-black/80 rounded-full',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };