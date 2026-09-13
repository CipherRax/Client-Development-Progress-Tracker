'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Terminal, GitBranch, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { PublicMilestone } from '@/lib/api/types';
import { contactSchema, type ContactValues } from '@/lib/validation';
import { usePublicDashboard, useContactForm } from '@/lib/hooks/use-public';
import { useUiStore } from '@/stores/ui-store';
import { ProgressRing } from '@/components/shared/progress-ring';
import { PublicFooter } from '@/components/shared/footer';
import { cn, formatLedgerDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Spinner } from '@/components/ui/skeleton';
import { EstimateTimeline } from '@/components/admin/project/estimate-timeline';

function statusLabel(s: string) {
  return s.replace(/_/g, ' ');
}

function milestoneBarColor(s: string) {
  switch (s) {
    case 'COMPLETED': return 'bg-success';
    case 'IN_PROGRESS': return 'bg-brand shadow-[0_0_12px_rgba(45,212,191,0.4)]';
    case 'BLOCKED': return 'bg-danger';
    case 'SKIPPED': return 'bg-zinc-500';
    default: return 'bg-white/15';
  }
}

function GlassPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      'rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 backdrop-blur-xl shadow-[0_2px_24px_rgba(0,0,0,0.35)]',
      className,
    )}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
      <span className="h-px flex-1 bg-white/[0.06]" />
      {children}
      <span className="h-px flex-1 bg-white/[0.06]" />
    </h2>
  );
}

export function PublicDashboard({ token }: { token: string }) {
  const router = useRouter();
  const { data, isLoading, isError } = usePublicDashboard(token);
  const publicTheme = useUiStore((s) => s.publicTheme);
  const togglePublicTheme = useUiStore((s) => s.togglePublicTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', publicTheme === 'dark');
  }, [publicTheme]);

  useEffect(() => {
    if (isError) router.replace('/p/invalid');
  }, [isError, router]);

  if (isLoading) {
    return (
      <div className="scheme-dark dark flex min-h-dvh items-center justify-center bg-[#06080c]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-6 text-brand" />
          <p className="animate-pulse font-mono text-[11px] text-white/30 uppercase tracking-[0.2em]">
            Loading project data
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { project, currentWork, nextMilestone, milestones, updates, changeRequests, timeline } = data;

  return (
    <div className="scheme-dark dark relative min-h-dvh overflow-hidden bg-[#06080c] text-white">
      {/* Aurora backdrop */}
      <div aria-hidden className="animate-drift pointer-events-none absolute -top-48 left-1/4 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-brand/20 blur-[160px]" />
      <div aria-hidden className="animate-drift-slow pointer-events-none absolute -bottom-32 right-1/5 h-[34rem] w-[34rem] rounded-full bg-plum/15 blur-[150px]" />
      <div aria-hidden className="animate-pulse-glow pointer-events-none absolute left-1/2 top-[45%] h-80 w-80 -translate-x-1/2 rounded-full bg-info/10 blur-[120px]" />

      {/* Grid */}
      <div aria-hidden className="bg-grid-dark mask-fade pointer-events-none absolute inset-0 opacity-60" />

      {/* Scan line */}
      <div aria-hidden className="animate-scan pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />

      {/* Top hairline */}
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />

      <header className="relative mx-auto flex max-w-3xl flex-col gap-5 px-5 pt-10 pb-4 sm:pt-14">
        {/* Eyebrow + toggle */}
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-brand/70">
            trackly · client portal
          </p>
          <button
            type="button"
            onClick={togglePublicTheme}
            className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] text-white/30 transition-colors hover:border-white/25 hover:text-white/60"
            aria-label="Toggle dark mode"
          >
            {publicTheme === 'dark' ? '☀ light' : '● dark'}
          </button>
        </div>

        <div>
          <h1 className="text-glow font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {project.name}
          </h1>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <PillBadge color="emerald" glow={project.health === 'ON_TRACK'}>{statusLabel(project.status)}</PillBadge>
          <PillBadge color={project.health === 'AT_RISK' ? 'amber' : project.health === 'DELAYED' ? 'red' : 'emerald'} glow={false}>{project.health.replace(/_/g, ' ')}</PillBadge>
          {project.pausedTimeDays > 0 && (
            <PillBadge color="amber" glow={false}>Paused {project.pausedTimeDays}d total</PillBadge>
          )}
          {project.additionalTimeDays > 0 && (
            <PillBadge color="amber" glow={false}>Extended +{project.additionalTimeDays}d</PillBadge>
          )}
        </div>
      </header>

      <main className="relative mx-auto flex max-w-3xl flex-col gap-7 px-5 pb-20 pt-4">
        {/* Hero: progress ring + ETA */}
        <GlassPanel className="flex flex-wrap items-center gap-8 sm:gap-10">
          <div className="flex items-center justify-center">
            <ProgressRing value={project.progress} size={130} stroke={10} labelClassName="!text-2xl !text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Estimated completion</p>
            <p className="mt-1.5 font-mono text-2xl font-bold font-mono-num text-white">{formatLedgerDate(project.estimatedCompletionDate)}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 font-mono text-xs font-semibold text-brand">
              <Clock className="size-3" />
              {project.estimatedDaysRemaining} day{project.estimatedDaysRemaining === 1 ? '' : 's'} remaining
            </div>
            {project.description && (
              <p className="mt-4 max-w-prose text-sm leading-relaxed text-white/55">{project.description}</p>
            )}
          </div>
        </GlassPanel>

        {/* Current work — terminal style */}
        {currentWork && (
          <GlassPanel className="border-brand/20 bg-brand/[0.04]">
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand/60">
              <Terminal className="size-3.5" /> focus right now
            </div>
            <p className="font-display text-lg font-bold text-white">{currentWork.title}</p>
            {currentWork.description && <p className="mt-1.5 text-sm text-white/50">{currentWork.description}</p>}
            {currentWork.expectedCompletionDate && (
              <p className="mt-2 font-mono text-xs font-mono-num text-white/35">
                expected {formatLedgerDate(currentWork.expectedCompletionDate)}
              </p>
            )}
          </GlassPanel>
        )}

        {nextMilestone && (
          <p className="text-center font-mono text-xs text-white/35">
            next → <span className="font-semibold text-white/70">{nextMilestone.title}</span>
          </p>
        )}

        {/* Milestones */}
        <section>
          <SectionTitle>Milestones</SectionTitle>
          <MilestoneStepper milestones={milestones} />
        </section>

        {/* Timeline */}
        <GlassPanel>
          <SectionTitle>How the deadline moved</SectionTitle>
          <EstimateTimeline
            startDate={project.startDate}
            originalCompletionDate={project.originalEstimatedCompletionDate}
            currentCompletionDate={project.estimatedCompletionDate}
            approvedChangeRequests={changeRequests.filter((cr) => cr.status === 'APPROVED' && cr.approvedAt)}
          />
        </GlassPanel>

        {/* Change requests */}
        {changeRequests.length > 0 && (
          <section>
            <SectionTitle>Approved changes</SectionTitle>
            <ul className="space-y-2">
              {changeRequests.map((cr) => (
                <li
                  key={cr.title + cr.approvedAt}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4"
                >
                  <div className="flex items-start gap-2">
                    <GitBranch className="mt-0.5 size-3.5 shrink-0 text-brand/60" />
                    <div>
                      <p className="font-display text-sm font-semibold text-white">{cr.title}</p>
                      {cr.description && <p className="mt-1 text-sm text-white/45">{cr.description}</p>}
                      <div className="mt-1.5 flex items-center gap-3 font-mono text-[11px] text-white/35">
                        {cr.previousCompletionDate && cr.newCompletionDate && (
                          <span>
                            ETA {formatLedgerDate(cr.previousCompletionDate)}{' '}
                            →{' '}
                            <span className="text-brand font-semibold font-mono-num">{formatLedgerDate(cr.newCompletionDate)}</span>
                          </span>
                        )}
                        {cr.approvedAt && <span>approved {formatLedgerDate(cr.approvedAt)}</span>}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Updates */}
        {updates.length > 0 && (
          <section>
            <SectionTitle>Project updates</SectionTitle>
            <div className="flex flex-col divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03]">
              {updates.map((u) => (
                <div key={u.publishedAt + u.title} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-sm font-semibold text-white">{u.title}</p>
                    <p className="shrink-0 font-mono text-[11px] font-mono-num text-white/30">{formatLedgerDate(u.publishedAt)}</p>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-white/50">{u.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Timeline events */}
        {timeline.length > 0 && (
          <section>
            <SectionTitle>Timeline</SectionTitle>
            <ul className="relative border-l border-white/[0.08] pl-5">
              {timeline.map((t) => (
                <li key={t.createdAt + t.eventType} className="relative pb-4 last:pb-0">
                  <span className="absolute -left-[22px] top-1 size-2.5 rounded-full bg-brand ring-2 ring-[#06080c]" aria-hidden />
                  <p className="text-sm font-medium text-white/80">{t.description}</p>
                  <p className="mt-0.5 font-mono text-[11px] font-mono-num text-white/30">
                    {t.eventType.replace(/_/g, ' ')} · {formatLedgerDate(t.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Contact */}
        <GlassPanel className="border-white/[0.06]">
          <h2 className="font-display text-base font-bold text-white">Contact the team</h2>
          <p className="mt-1 mb-4 text-sm text-white/40">
            Questions, blockers, or just checking in? Rate-limited to 3 messages per minute.
          </p>
          <ContactForm token={token} />
        </GlassPanel>

        <PublicFooter />
      </main>
    </div>
  );
}

/* ─── Pill badges ─────────────────────────────────────────────────────────── */

const pillColors = {
  emerald: 'border-success/30 bg-success/10 text-emerald-300',
  amber: 'border-amber/30 bg-amber/10 text-amber-300',
  red: 'border-danger/30 bg-danger/10 text-red-300',
  neutral: 'border-white/10 bg-white/[0.05] text-white/60',
};

function PillBadge({
  color = 'neutral',
  glow,
  children,
}: {
  color?: keyof typeof pillColors;
  glow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium',
        pillColors[color],
        glow && 'shadow-[0_0_14px_rgba(45,212,191,0.25)]',
      )}
    >
      {children}
    </span>
  );
}

/* ─── Milestones ──────────────────────────────────────────────────────────── */

function MilestoneStepper({ milestones }: { milestones: PublicMilestone[] }) {
  if (!milestones.length) {
    return <p className="font-mono text-xs text-white/30">No milestones yet.</p>;
  }

  return (
    <div className="flex flex-col gap-0">
      {milestones.map((m, i) => {
        const completed = m.status === 'COMPLETED';
        const active = m.status === 'IN_PROGRESS';
        return (
          <div key={m.title} className="flex gap-4">
            <div className="relative flex flex-col items-center">
              <span
                className={cn(
                  'relative z-10 mt-1.5 size-3 rounded-full ring-4 ring-[#06080c]',
                  completed
                    ? 'bg-success shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    : active
                      ? 'bg-brand shadow-[0_0_12px_rgba(45,212,191,0.5)]'
                      : m.status === 'BLOCKED'
                        ? 'bg-danger'
                        : 'bg-white/15',
                )}
              />
              {i < milestones.length - 1 && (
                <span className="w-px flex-1 bg-white/[0.08]" aria-hidden />
              )}
            </div>
            <div className="pb-6 pt-0.5">
              <p className={cn(
                'font-display text-sm font-semibold',
                completed ? 'text-white/45' : 'text-white',
              )}>
                {m.title}
                {completed && <span className="ml-2 inline-block rounded-full bg-success/15 px-2 py-px font-mono text-[10px] text-success">done</span>}
                {active && <span className="ml-2 inline-block rounded-full bg-brand/15 px-2 py-px font-mono text-[10px] text-brand">current</span>}
              </p>
              {m.description && <p className="mt-0.5 text-sm text-white/45">{m.description}</p>}
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', milestoneBarColor(m.status))}
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] font-medium font-mono-num text-white/40">{Math.round(m.progress)}%</span>
              </div>
              {m.estimatedCompletionDate && (
                <p className="mt-0.5 font-mono text-[11px] font-mono-num text-white/25">
                  est. {formatLedgerDate(m.estimatedCompletionDate)}
                </p>
              )}
              {m.tasks && m.tasks.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {m.tasks.map((t) => (
                    <li key={t.title} className="flex items-center gap-2 font-mono text-xs text-white/40">
                      <span className={cn(
                        'size-1.5 rounded-full',
                        t.status === 'COMPLETED' ? 'bg-success' : t.status === 'IN_PROGRESS' ? 'bg-brand' : 'bg-white/20',
                      )} />
                      <span className={t.status === 'COMPLETED' ? 'line-through opacity-50' : ''}>{t.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Contact form ────────────────────────────────────────────────────────── */

function ContactForm({ token }: { token: string }) {
  const send = useContactForm(token);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (values: ContactValues) => {
    // The mutation hook owns all feedback (sonner toast on success/error).
    await send.mutateAsync(values);
    reset();
  };

  const fieldInputClass = cn(
    'border-white/10 bg-white/[0.04] text-white placeholder:text-white/25',
    'focus-visible:border-brand focus-visible:ring-brand/40',
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">Your name <span className="text-brand">*</span></label>
          <Input {...register('name')} placeholder="Jane Ndegwa" className={fieldInputClass} />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">Email <span className="text-brand">*</span></label>
          <Input type="email" {...register('email')} placeholder="jane@company.example" className={fieldInputClass} />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">Message <span className="text-brand">*</span></label>
        <Textarea rows={3} {...register('message')} placeholder="How's the project going?" className={fieldInputClass} />
        {errors.message && <p className="text-xs text-red-400">{errors.message.message}</p>}
      </div>
      <Button
        type="submit"
        disabled={send.isPending}
        className="w-fit rounded-full bg-white/[0.08] px-5 text-[13px] font-semibold text-white shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all hover:bg-white/[0.14] hover:shadow-[0_0_28px_rgba(255,255,255,0.12)]"
      >
        {send.isPending ? <Spinner className="size-4 text-white" /> : <><Send /> Send message</>}
      </Button>
      {send.isError && (
        <p className="text-xs text-red-400">{(send.error as Error)?.message ?? 'Failed to send.'}</p>
      )}
    </form>
  );
}