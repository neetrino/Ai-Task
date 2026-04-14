'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { BitrixSyncConfirmDialog } from '@/features/bitrix-sync/BitrixSyncConfirmDialog';
import { syncProjectToBitrix } from '@/features/bitrix-sync/sync-actions';
import { WORKSPACE_GHOST_BTN_CLASS } from '@/shared/ui/workspace-ui';

const COMPACT_GHOST =
  'rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-xs font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/[0.07] disabled:opacity-60';
const COMPACT_PRIMARY =
  'rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60';

export function SyncToolbar({
  projectId,
  phaseId,
  compact = false,
}: {
  projectId: string;
  phaseId: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ghostClass = compact ? COMPACT_GHOST : WORKSPACE_GHOST_BTN_CLASS;
  const primaryClass = compact
    ? COMPACT_PRIMARY
    : 'rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60';

  function run(dryRun: boolean) {
    setMessage(null);
    setError(null);
    start(async () => {
      const res = await syncProjectToBitrix(projectId, phaseId, dryRun);
      if ('error' in res) {
        setError(res.error);
        return;
      }
      setMessage(res.message);
      router.refresh();
    });
  }

  function requestRealSync() {
    setConfirmOpen(true);
  }

  function cancelConfirm() {
    if (!pending) setConfirmOpen(false);
  }

  function confirmRealSync() {
    setConfirmOpen(false);
    run(false);
  }

  return (
    <>
      <BitrixSyncConfirmDialog
        onCancel={cancelConfirm}
        onConfirm={confirmRealSync}
        open={confirmOpen}
        pending={pending}
      />
      <div className={compact ? 'flex flex-col gap-1' : 'flex flex-col gap-3'}>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            className={ghostClass}
            disabled={pending}
            onClick={() => run(true)}
            type="button"
          >
            Dry-run sync
          </button>
          <button
            className={primaryClass}
            disabled={pending}
            onClick={requestRealSync}
            type="button"
          >
            {pending ? 'Syncing…' : 'Sync to Bitrix'}
          </button>
        </div>
        {error ? (
          <p className={compact ? 'max-w-[14rem] text-[11px] text-red-400' : 'text-sm text-red-400'}>
            {error}
          </p>
        ) : null}
        {message ? (
          <p
            className={
              compact ? 'max-w-[14rem] text-[11px] text-emerald-400/95' : 'text-sm text-emerald-400/95'
            }
          >
            {message}
          </p>
        ) : null}
      </div>
    </>
  );
}
