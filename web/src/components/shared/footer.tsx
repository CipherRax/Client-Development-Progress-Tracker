import { APP_NAME, APP_VERSION, FOOTER_REGION_TAG } from '@/lib/constants';
import { copyright } from '@/lib/utils';

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="flex size-4 items-center justify-center rounded bg-gradient-to-br from-brand to-brand-strong font-display text-[10px] font-bold text-white">
        T
      </span>
      <span className="font-display text-xs font-semibold tracking-tight">{APP_NAME}</span>
    </span>
  );
}

/**
 * Quiet footer for the admin console. Sparse by design: wordmark, copyright,
 * and a build tag. Matches the dark technical instrument (see DESIGN.md).
 */
export function AdminFooter() {
  return (
    <div className="border-t border-white/[0.06] px-4 lg:px-8">
      <div className="mx-auto max-w-5xl py-5">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-zinc-500">
          <span className="flex items-center gap-3">
            <Wordmark />
            <span aria-hidden className="text-zinc-700">
              ·
            </span>
            <span>{copyright(new Date().getFullYear())}</span>
          </span>
          <span className="text-zinc-600">build v{APP_VERSION}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Quiet footer for the public client dashboard. Adds the region tag and a
 * "Powered by Trackly" line tying back to the developer contact form.
 * Adapts to both the light and dark public themes.
 */
export function PublicFooter() {
  return (
    <footer className="border-t border-ink/10 dark:border-white/10">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-5 py-6 text-center">
        <div className="flex items-center justify-center gap-3 text-ink/60 dark:text-white/40">
          <Wordmark />
          <span aria-hidden className="text-ink/25 dark:text-white/15">
            ·
          </span>
          <span className="font-mono text-[11px]">{copyright(new Date().getFullYear())}</span>
          <span aria-hidden className="text-ink/25 dark:text-white/15">
            ·
          </span>
          <span className="font-mono text-[11px]">{FOOTER_REGION_TAG}</span>
        </div>
        <p className="font-mono text-[10px] text-ink/40 dark:text-white/25">
          Powered by {APP_NAME} · Questions? Use the contact form above, or ask
          your developer.
        </p>
      </div>
    </footer>
  );
}