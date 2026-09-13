'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ApplicationShell } from '@/components/admin/shell';
import { useAuthStore } from '@/stores/auth-store';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const admin = useAuthStore((s) => s.admin);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token || !admin) router.replace('/login');
  }, [token, admin, router, hasHydrated]);

  if (!hasHydrated) {
    return <div className="min-h-dvh animate-pulse bg-canvas" />;
  }

  if (!token || !admin) {
    return <div className="min-h-dvh bg-canvas" />;
  }

  return children;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <ApplicationShell>{children}</ApplicationShell>
    </AdminGuard>
  );
}