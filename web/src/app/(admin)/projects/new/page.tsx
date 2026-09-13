'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectForm } from '@/components/admin/project-form';

function Inner() {
  const params = useSearchParams();
  const clientId = params.get('client') ?? undefined;
  return <ProjectForm clientId={clientId} />;
}

export default function NewProjectPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href="/projects" className="inline-flex w-fit items-center gap-1 text-sm text-ink/60 hover:text-brand dark:text-zinc-400">
        <ChevronLeft className="size-4" /> Back to projects
      </Link>
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">New project</h1>
        <p className="text-sm text-ink/60 dark:text-zinc-400">Set the baseline estimate — it anchors the client&apos;s timeline.</p>
      </header>
      <Card>
        <CardContent>
          <Suspense>
            <Inner />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}