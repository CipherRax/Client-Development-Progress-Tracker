import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PublicDashboard } from '@/components/public/public-dashboard';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // Tokens are opaque, generated values (base64url). We only pass them to the
  // client component which sends them via the x-client-access-token header.
  return (
    <Suspense fallback={<div className="min-h-dvh bg-paper" />}>
      <PublicDashboard token={decodeURIComponent(token)} />
    </Suspense>
  );
}