'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, Menu, FolderKanban, Users, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', Icon: Users },
  { href: '/projects', label: 'Projects', Icon: FolderKanban },
  { href: '/settings/profile', label: 'Settings', Icon: Settings },
];

export function ApplicationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const admin = useAuthStore((s) => s.admin);
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const logout = useLogout();

  const handleLogout = () => logout.mutate();

  return (
    <div className="dark scheme-dark relative min-h-dvh overflow-hidden bg-[#06080c] text-white">
      {/* Aurora orbs */}
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute -top-48 left-1/4 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-brand/15 blur-[150px]"
      />
      <div
        aria-hidden
        className="animate-drift-slow pointer-events-none absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-plum/12 blur-[140px]"
      />
      <div
        aria-hidden
        className="animate-pulse-glow pointer-events-none absolute left-1/2 top-[30%] h-80 w-80 -translate-x-1/2 rounded-full bg-info/10 blur-[120px]"
      />

      {/* Technical grid */}
      <div aria-hidden className="bg-grid-dark mask-fade pointer-events-none absolute inset-0 opacity-45" />

      {/* Drifting scan line */}
      <div
        aria-hidden
        className="animate-scan pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent"
      />

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.07] bg-white/[0.04] px-4 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded bg-gradient-to-br from-brand to-brand-strong font-display text-sm font-bold text-white shadow-[0_0_14px_rgba(45,212,191,0.35)]">
            C
          </span>
          <span className="font-display text-sm font-semibold">Tracker Console</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="rounded-md p-2 text-zinc-300 hover:bg-white/[0.07]"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        aria-label="Primary"
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/[0.06] bg-[#0a0d12]/85 backdrop-blur-xl transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-5">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <span className="flex size-7 items-center justify-center rounded bg-gradient-to-br from-brand to-brand-strong font-display text-sm font-bold text-white shadow-[0_0_14px_rgba(45,212,191,0.35)]">
              C
            </span>
            <span className="font-display text-sm font-semibold tracking-tight">Tracker Console</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-white/[0.08] lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand/15 text-brand shadow-[0_0_18px_rgba(45,212,191,0.15)]'
                    : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white',
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-brand/15 font-display text-xs font-bold text-brand">
              {admin?.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{admin?.name ?? 'Admin'}</p>
              <p className="truncate text-xs text-zinc-500">{admin?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="justify-start border-white/[0.12] text-zinc-300 hover:bg-white/[0.06] hover:text-white"
          >
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Desktop top bar */}
      <header className="sticky top-0 z-30 hidden h-14 items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-6 backdrop-blur-xl lg:flex">
        <p className="flex items-center gap-2 font-mono text-xs text-zinc-400">
          <span className="size-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(45,212,191,0.7)]" aria-hidden />
          {admin?.email}
        </p>
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-600">
          studio console · cdp tracker
        </p>
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}

      <main className="relative lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}