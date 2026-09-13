'use client';

import { useState } from 'react';
import { ExternalLink, Link2, RefreshCw, ShieldOff, Copy, Check } from 'lucide-react';
import {
  useClientAccess,
  useGenerateClientAccess,
  useRegenerateClientAccess,
  useRevokeClientAccess,
} from '@/lib/hooks/use-client-access';
import type { ClientAccessTokenGenerated } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form';
import { formatLedgerDate } from '@/lib/utils';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002';

export function ClientAccessPanel({
  projectId,
  clientAccessEnabled,
}: {
  projectId: string;
  clientAccessEnabled: boolean;
}) {
  const { data: records, isLoading } = useClientAccess(projectId);
  const generate = useGenerateClientAccess(projectId);
  const regenerate = useRegenerateClientAccess(projectId);
  const revoke = useRevokeClientAccess(projectId);
  const [generated, setGenerated] = useState<ClientAccessTokenGenerated | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState('');

  const activeRecord = records?.find((r) => r.active) ?? null;

  const handleGenerate = async () => {
    const res = await generate.mutateAsync(expiry ? { expiresAt: new Date(expiry).toISOString() } : undefined);
    setGenerated(res);
  };

  const handleRegenerate = async () => {
    const res = await regenerate.mutateAsync();
    setGenerated(res);
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const linkUrl = (token: string) => `${APP_URL}/p/${encodeURIComponent(token)}`;

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-display text-base font-semibold">Client Access</h3>

      {isLoading && <Spinner className="mx-auto my-6" />}

      {!isLoading && !clientAccessEnabled && (
        <p className="rounded-md border border-dashed border-line px-6 py-6 text-center text-sm text-ink/50 dark:text-zinc-500">
          Client access is disabled for this project.
        </p>
      )}

      {!isLoading && clientAccessEnabled && (
        <div className="flex flex-col gap-4">
          {activeRecord ? (
            <div className="max-w-xl rounded-md border border-brand/20 bg-brand/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Link2 className="size-4 text-brand" /> Active link
                </p>
                <p className="text-xs text-ink/50 dark:text-zinc-500">
                  {activeRecord.expiresAt && <span>expires {formatLedgerDate(activeRecord.expiresAt)}</span>}
                  {activeRecord.expiresAt && <span> · </span>}
                  <span>{activeRecord.accessCount} open{activeRecord.accessCount === 1 ? '' : 's'}</span>
                </p>
              </div>

              {generated ? (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-brand/30 bg-white px-3 py-2 dark:bg-panel">
                  <span className="truncate font-mono text-xs" data-testid="access-link">{linkUrl(generated.token)}</span>
                  <button
                    type="button"
                    onClick={() => copyLink(linkUrl(generated.token))}
                    className="shrink-0"
                    aria-label="Copy link"
                  >
                    {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-ink/50 dark:text-zinc-500">
                  The token is only shown once — copy it, then send it to the client. Tokens are hashed in storage.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                <a href={generated ? linkUrl(generated.token) : undefined} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="sm"><ExternalLink /> Open</Button>
                </a>
                <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={regenerate.isPending}>
                  <RefreshCw /> Regenerate
                </Button>
                <Button variant="ghost" size="sm" className="text-danger" onClick={() => revoke.mutate()} disabled={revoke.isPending}>
                  <ShieldOff /> Revoke
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-md rounded-md border border-line p-4">
              <div className="mb-3 flex flex-wrap items-end gap-3">
                <Field label="Expiration (optional)" error={undefined}>
                  <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                </Field>
                <Button onClick={handleGenerate} disabled={generate.isPending}>
                  {generate.isPending ? <Spinner /> : <><Link2 /> Generate link</>}
                </Button>
              </div>
              {generated ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-brand/30 bg-brand/5 px-3 py-2">
                  <span className="truncate font-mono text-xs" data-testid="access-link">{linkUrl(generated.token)}</span>
                  <button type="button" onClick={() => copyLink(linkUrl(generated.token))} className="shrink-0" aria-label="Copy link">
                    {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-ink/50 dark:text-zinc-500">
                  Create a secure single-token link for the client. Tokens are returned once only.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}