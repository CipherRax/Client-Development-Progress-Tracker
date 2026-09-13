'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Hand-rolled SVG circular progress indicator. True stroke-dashoffset sweep,
 * animated on mount, with a mono-styled percentage label.
 */
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  className,
  labelClassName,
  showLabel = true,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  labelClassName?: string;
  showLabel?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [drawn, setDrawn] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(clamped));
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const offset = circumference - (drawn / 100) * circumference;

  // Tune the colour by value — green healthier, amber risk, red delayed.
  const ringColor =
    clamped >= 100
      ? 'var(--color-success)'
      : clamped >= 50
        ? 'var(--color-success)'
        : clamped >= 25
          ? 'var(--color-amber)'
          : 'var(--color-danger)';

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress ${Math.round(clamped)} percent`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-black/[0.08] dark:stroke-white/[0.1]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke={ringColor}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      {showLabel && (
        <span
          className={cn('absolute font-mono-num font-mono font-semibold', labelClassName)}
          style={{ fontSize: size / 4.2 }}
        >
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}