'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, Menu, Moon, FolderKanban, Sun, Users, X, Settings } from 'lucide-react';
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

function useThemeClass() {
  const theme = useUiStore((s) => s.adminTheme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
}

export function ApplicationShell({ children }: { children: React.ReactNode }) {
  useThemeClass();
  const pathname = usePathname();
  const admin = useAuthStore((s) => s.admin);
  const { adminTheme, toggleAdminTheme, sidebarOpen, setSidebarOpen } = useUiStore();
  const logout = useLogout();

  const handleLogout = () => logout.mutate();

  return (
    <div className="min-h-dvh bg-paper dark:bg-canvas text-ink dark:text-white">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 backdrop-blur dark:bg-canvas/90 px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded bg-gradient-to-br from-brand to-brand-strong font-display text-sm font-bold text-white shadow-[0_0_14px_rgba(45,212,191,0.35)]">
            C
          </span>
          <span className="font-display text-sm font-semibold">Tracker</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleAdminTheme}
            aria-label="Toggle theme"
            className="rounded-md p-2 hover:bg-black/5 dark:hover:bg-white/10"
          >
            {adminTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="rounded-md p-2 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        aria-label="Primary"
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-line bg-white dark:bg-panel transition-transform lg:translate-x-0 dark:text-white',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-5">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <span className="flex size-7 items-center justify-center rounded bg-gradient-to-br from-brand to-brand-strong font-display text-sm font-bold text-white shadow-[0_0_14px_rgba(45,212,191,0.35)]">
              C
            </span>
            <span className="font-display text-sm font-semibold tracking-tight">Tracker Console</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-ink/50 hover:bg-black/5 lg:hidden dark:text-zinc-400 dark:hover:bg-white/10"
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
                  'flex items-center gap-3 rounded-[3px] px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand/10 text-brand-strong dark:bg-brand/15 dark:text-brand'
                    : 'text-ink/70 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-line p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-brand/15 font-display text-xs font-bold text-brand-strong dark:text-brand">
              {admin?.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{admin?.name ?? 'Admin'}</p>
              <p className="truncate text-xs text-ink/50 dark:text-zinc-500">{admin?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={logout.isPending} className="justify-start">
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Desktop top bar */}
      <header className="sticky top-0 z-30 hidden h-14 items-center justify-between border-b border-line bg-white/90 px-6 backdrop-blur lg:flex dark:bg-canvas/90">
        <p className="text-sm text-ink/50 dark:text-zinc-500">
          <span className="font-mono text-xs">{admin?.email}</span>
        </p>
        <button
          type="button"
          onClick={toggleAdminTheme}
          aria-label="Toggle theme"
          className="rounded-md p-2 text-ink/60 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
        >
          {adminTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}