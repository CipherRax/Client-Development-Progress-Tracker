'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useClients } from '@/lib/hooks/use-clients';
import { ClientStatusPill } from '@/components/shared/pills';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/shared/pagination';
import { LoadingRows, ErrorState, EmptyState } from '@/components/shared/states';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useClients({ search: search || undefined, page, limit: 10 });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-ink/60 dark:text-zinc-400">Everyone you build for.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            aria-label="Search clients"
            placeholder="Search clients…"
            className="w-56"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Link href="/clients/new">
            <Button>
              <Plus /> New client
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <LoadingRows rows={6} />}
        {isError && <ErrorState description={error?.message} onRetry={() => refetch()} />}
        {data?.clients.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}`}
            className="group rounded-md border border-line bg-white p-5 transition-colors hover:border-brand/50 dark:bg-panel"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold">{c.name}</p>
                {c.companyName && <p className="truncate text-xs text-ink/50 dark:text-zinc-500">{c.companyName}</p>}
              </div>
              <ClientStatusPill status={c.status} />
            </div>
            <p className="mt-3 truncate text-sm text-ink/60 dark:text-zinc-400">{c.email}</p>
            <p className="mt-1 text-xs text-ink/40 dark:text-zinc-500">{c.phone || 'No phone on file'}</p>
          </Link>
        ))}
        {data && data.clients.length === 0 && (
          <EmptyState
            className="col-span-full"
            title="No clients found"
            description={search ? 'Try a different search term.' : 'Create your first client to begin.'}
            action={
              !search ? (
                <Link href="/clients/new">
                  <Button variant="soft" size="sm"><Plus /> New client</Button>
                </Link>
              ) : undefined
            }
          />
        )}
      </div>

      <Pagination page={page} totalPages={data?.meta.totalPages ?? 1} total={data?.meta.total} onPageChange={setPage} />
    </div>
  );
}