'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { ClientForm } from '@/components/admin/client-form';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function NewClientPage() {
  const router = useRouter();
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Link href="/clients" className="inline-flex w-fit items-center gap-1 text-sm text-ink/60 hover:text-brand dark:text-zinc-400">
        <ChevronLeft className="size-4" /> Back to clients
      </Link>
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">New client</h1>
        <p className="text-sm text-ink/60 dark:text-zinc-400">Add a client before creating projects.</p>
      </header>
      <Card>
        <CardContent>
          <ClientForm onDone={() => router.push('/clients')} />
        </CardContent>
      </Card>
    </div>
  );
}